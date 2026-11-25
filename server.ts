import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

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

  // API endpoint to analyze food photo
  app.post("/api/analyze-food", async (req, res) => {
    try {
      const { image, mimeType, description } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Необходимо передать изображение еды." });
      }

      const cleanBase64 = image.replace(/^data:image\/[a-z]+;base64,/, "");
      const resolvedMimeType = mimeType || "image/jpeg";

      const prompt = `Ты профессиональный диетолог и эксперт по нутрициологии. Проанализируй эту фотографию еды/блюда.
${description ? `Дополнительное описание от пользователя: "${description}"` : ""}

Верни строго JSON объект следующей структуры без лишнего текста и без markdown-окружения (или в чистом json):
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

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: [
          {
            inlineData: {
              mimeType: resolvedMimeType,
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
        config: {
          responseMimeType: "application/json",
          systemInstruction: "Ты опытный нутрициолог и эксперт по подсчету калорий. Отвечай только валидным JSON согласно схеме.",
        },
      });

      const textResult = response.text;
      if (!textResult) {
        throw new Error("Не удалось получить ответ от ИИ.");
      }

      let cleanedJsonStr = textResult.trim();
      if (cleanedJsonStr.startsWith("```json")) {
        cleanedJsonStr = cleanedJsonStr.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleanedJsonStr.startsWith("```")) {
        cleanedJsonStr = cleanedJsonStr.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      const parsedData = JSON.parse(cleanedJsonStr);
      res.json(parsedData);
    } catch (error: any) {
      console.error("Error analyzing food:", error);
      res.status(500).json({ error: error.message || "Ошибка при анализе фотографии блюда." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();
