import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  const ALLOWED_IMAGE_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ]);
  const ALLOWED_MEAL_TYPES = new Set(["breakfast", "lunch", "dinner", "snack"]);

  function extractJsonObject(rawText: string): Record<string, any> {
    let cleaned = rawText.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    try {
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        const sliced = cleaned.slice(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(sliced);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed;
        }
      }
    }

    throw new Error("AI response was not a valid JSON object.");
  }

  function normalizeAnalysisResult(raw: Record<string, any>, lang: "ru" | "en") {
    const dishName =
      typeof raw.dishName === "string" && raw.dishName.trim().length > 0
        ? raw.dishName.trim()
        : lang === "en"
          ? "Meal from photo"
          : "Блюдо по фото";

    const rawIngredients = Array.isArray(raw.ingredients) ? raw.ingredients : [];
    const ingredients = rawIngredients
      .filter((item) => item && typeof item === "object")
      .slice(0, 20)
      .map((item: any) => ({
        name: String(item.name || "").trim(),
        amount: String(item.amount || "").trim(),
      }))
      .filter((item) => item.name.length > 0);

    const mealType =
      typeof raw.mealType === "string" && ALLOWED_MEAL_TYPES.has(raw.mealType)
        ? raw.mealType
        : "lunch";

    const healthScoreNum = Number(raw.healthScore);
    const healthScore = Number.isFinite(healthScoreNum)
      ? Math.max(1, Math.min(10, Math.round(healthScoreNum)))
      : 7;

    return {
      dishName,
      weightGrams: Math.max(1, Math.round(Number(raw.weightGrams) || 250)),
      calories: Math.max(0, Math.round(Number(raw.calories) || 0)),
      protein: Math.max(0, Math.round(Number(raw.protein) || 0)),
      fat: Math.max(0, Math.round(Number(raw.fat) || 0)),
      carbs: Math.max(0, Math.round(Number(raw.carbs) || 0)),
      mealType,
      ingredients,
      healthScore,
      aiTip: typeof raw.aiTip === "string" ? raw.aiTip.trim() : "",
    };
  }

  const FOOD_RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
      dishName: { type: Type.STRING },
      weightGrams: { type: Type.NUMBER },
      calories: { type: Type.NUMBER },
      protein: { type: Type.NUMBER },
      fat: { type: Type.NUMBER },
      carbs: { type: Type.NUMBER },
      mealType: { type: Type.STRING },
      ingredients: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            amount: { type: Type.STRING },
          },
          required: ["name", "amount"],
        },
      },
      healthScore: { type: Type.INTEGER },
      aiTip: { type: Type.STRING },
    },
    required: [
      "dishName",
      "weightGrams",
      "calories",
      "protein",
      "fat",
      "carbs",
      "mealType",
      "ingredients",
      "healthScore",
      "aiTip",
    ],
  };

  async function analyzeWithFreeGemini(params: {
    cleanBase64: string;
    resolvedMimeType: string;
    prompt: string;
    systemInstruction: string;
  }): Promise<string> {
    const attempts: Array<{ model: string; thinkingLevel?: ThinkingLevel }> = [
      { model: "gemini-4-hydrogen", thinkingLevel: ThinkingLevel.LOW },
      { model: "gemini-3.1-flash-lite" },
    ];
    let responseText: string | undefined;
    let lastError: any;

    for (let attempt = 0; attempt < attempts.length; attempt++) {
      const current = attempts[attempt];
      try {
        const config: Record<string, any> = {
          responseMimeType: "application/json",
          responseSchema: FOOD_RESPONSE_SCHEMA,
          systemInstruction: params.systemInstruction,
        };
        if (current.thinkingLevel) {
          config.thinkingConfig = {
            thinkingLevel: current.thinkingLevel,
          };
        }

        const response = await ai.models.generateContent({
          model: current.model,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: params.resolvedMimeType,
                  data: params.cleanBase64,
                },
              },
              {
                text: params.prompt,
              },
            ],
          },
          config,
        });
        responseText = response.text;
        if (responseText) break;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err || "");
        console.warn(`Model ${current.model} failed:`, msg.slice(0, 300));
        const isAuthOrInvalidKey =
          msg.includes("API_KEY_INVALID") || msg.includes("PERMISSION_DENIED");
        if (isAuthOrInvalidKey || attempt === attempts.length - 1) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    if (!responseText) {
      throw lastError || new Error("Failed to get response from Gemini.");
    }

    return responseText;
  }

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // API endpoint to analyze food photo using free Google Gemini models
  app.post("/api/analyze-food", async (req, res) => {
    try {
      const { image, mimeType, description, language } = req.body ?? {};
      const lang: "ru" | "en" = language === "en" ? "en" : "ru";

      if (typeof image !== "string" || image.trim().length === 0) {
        return res.status(400).json({
          error:
            lang === "en"
              ? "Please provide a food image."
              : "Необходимо передать изображение еды.",
        });
      }

      const resolvedMimeType =
        typeof mimeType === "string" && mimeType.trim().length > 0
          ? mimeType.trim().toLowerCase()
          : "image/jpeg";

      if (!ALLOWED_IMAGE_MIME_TYPES.has(resolvedMimeType)) {
        return res.status(400).json({
          error:
            lang === "en"
              ? "Unsupported image format."
              : "Неподдерживаемый формат изображения.",
        });
      }

      const cleanBase64 = image.replace(/^data:[^;]+;base64,/, "").trim();
      if (!cleanBase64 || cleanBase64.length > 20 * 1024 * 1024) {
        return res.status(400).json({
          error:
            lang === "en"
              ? "Invalid or oversized image payload."
              : "Некорректный или слишком большой файл изображения.",
        });
      }

      const safeDescription =
        typeof description === "string"
          ? description.trim().slice(0, 500)
          : "";

      const prompt = lang === "en"
        ? `You are a professional nutritionist. Analyze this food/meal photo.
${safeDescription ? `Additional user note: "${safeDescription}"` : ""}

Return strictly a valid JSON object matching this schema with no extra text:
{
  "dishName": "Dish name in English",
  "weightGrams": number (estimated weight in grams),
  "calories": number (total calories in kcal),
  "protein": number (protein in grams),
  "fat": number (fat in grams),
  "carbs": number (carbohydrates in grams),
  "mealType": "breakfast" | "lunch" | "dinner" | "snack",
  "ingredients": [
    { "name": "ingredient name", "amount": "estimated amount (e.g. 150g)" }
  ],
  "healthScore": number from 1 to 10,
  "aiTip": "Brief nutritional tip about this meal in English"
}`
        : `Ты профессиональный диетолог и эксперт по нутрициологии. Проанализируй эту фотографию еды/блюда.
${safeDescription ? `Дополнительное описание от пользователя: "${safeDescription}"` : ""}

Верни строго JSON объект следующей структуры без лишнего текста:
{
  "dishName": "Название блюда на русском языке",
  "weightGrams": число (оценка веса в граммах),
  "calories": число (общие калории, ккал),
  "protein": число (белки в граммах),
  "fat": число (жиры в граммах),
  "carbs": число (углеводы в граммах),
  "mealType": "breakfast" или "lunch" или "dinner" или "snack",
  "ingredients": [
    { "name": "название ингредиента", "amount": "примерное количество (например, 150г)" }
  ],
  "healthScore": число от 1 до 10 (оценка полезности),
  "aiTip": "Краткий совет или нутрициологический комментарий к этому блюду на русском языке"
}`;

      const systemInstruction =
        lang === "en"
          ? "You are an experienced nutritionist and calorie counter. Respond strictly with valid JSON matching the schema."
          : "Ты опытный нутрициолог и эксперт по подсчету калорий. Отвечай только валидным JSON согласно схеме.";

      const geminiText = await analyzeWithFreeGemini({
        cleanBase64,
        resolvedMimeType,
        prompt,
        systemInstruction,
      });
      const parsedGemini = extractJsonObject(geminiText);
      return res.json(normalizeAnalysisResult(parsedGemini, lang));
    } catch (error: any) {
      console.error(
        "Error analyzing food:",
        error instanceof Error ? error.message : "unknown error"
      );
      res.status(500).json({
        error: "Ошибка при анализе фотографии блюда.",
      });
    }
  });

  const httpServer = createServer(app);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : { server: httpServer },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  const port = process.env.PORT || 3000;
  httpServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();
