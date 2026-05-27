import { Router } from "express";
import { randomUUID } from "crypto";
import { AnalyzeSetupBody } from "@workspace/api-zod";

const router = Router();

const tempImages = new Map<string, { data: Buffer; mimeType: string; expires: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of tempImages.entries()) {
    if (val.expires < now) tempImages.delete(key);
  }
}, 60_000);

router.get("/temp/:id", (req, res) => {
  const entry = tempImages.get(req.params.id);
  if (!entry || entry.expires < Date.now()) {
    res.status(404).json({ error: "Image not found or expired" });
    return;
  }
  res.set("Content-Type", entry.mimeType);
  res.send(entry.data);
});

router.post("/analyze", async (req, res) => {
  const parseResult = AnalyzeSetupBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { imageBase64, mimeType } = parseResult.data;

  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GROK_API_KEY не настроен" });
    return;
  }

  const imageId = randomUUID();
  const imageBuffer = Buffer.from(imageBase64, "base64");
  tempImages.set(imageId, {
    data: imageBuffer,
    mimeType,
    expires: Date.now() + 5 * 60 * 1000,
  });

  const domain = (process.env.REPLIT_DOMAINS ?? "").split(",")[0]?.trim();
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  const host = domain || devDomain;

  let imageUrl: string;
  if (host) {
    imageUrl = `https://${host}/api/temp/${imageId}`;
  } else {
    imageUrl = `data:${mimeType};base64,${imageBase64}`;
  }

  const prompt = `Ты — беспощадный, жёсткий критик компьютерных сетапов с 15-летним опытом. Ты видел тысячи сетапов уровня студии и не прощаешь посредственность. Твоя задача — честная, резкая, объективная оценка без лишней дипломатии.

ПРАВИЛА ОЦЕНКИ:
- Оценка 9-10: только абсолютно безупречные, студийного уровня сетапы
- Оценка 7-8: хорошая работа, но есть заметные недостатки
- Оценка 5-6: среднячок, много явных проблем
- Оценка 3-4: слабо, требует серьёзной переработки
- Оценка 1-2: катастрофа, нужно начинать с нуля
- Средний стол получает 4-5, НЕ 7-8. Будь строг.

Проанализируй фотографию компьютерного места и оцени по каждому критерию ЖЁСТКО и ЧЕСТНО.

Критерии:
1. Эстетика — цветовая гамма, стиль, визуальная целостность, подбор периферии
2. Освещение — качество, направление, цветовая температура, наличие bias lighting
3. Чистота — пыль, беспорядок, лишние предметы, провода на столе
4. Эргономика — высота монитора, расстояние, угол обзора, положение клавиатуры/мыши
5. Кабель-менеджмент — видимые провода, cable box, кабель-каналы
6. Атмосфера — общее ощущение, уют, "хочется ли здесь работать/играть"
7. Минимализм — нет ли лишнего на столе, соблюдается ли принцип "меньше — лучше"

Для каждого критерия:
- поставь оценку от 1 до 10 (честно, без завышения)
- напиши резкий, конкретный комментарий на русском языке — что именно плохо или хорошо

После этого:
- поставь общую взвешенную оценку
- напиши подробный обзор в стиле жёсткого критика — без сюсюканья, с конкретикой
- дай 3-5 конкретных советов по улучшению (не общие фразы, а конкретные действия)

Отвечай ТОЛЬКО в JSON формате без каких-либо дополнительных символов, только чистый JSON.

Формат ответа:
{
  "overall_score": 5.2,
  "categories": {
    "aesthetics": { "score": 6, "comment": "Хаотичный подбор периферии без единого стиля — чёрная клавиатура, белый монитор, синяя мышь." },
    "lighting": { "score": 4, "comment": "Одна лампа сбоку даёт резкие тени. Bias lighting отсутствует." },
    "cleanliness": { "score": 5, "comment": "На столе три лишних предмета, провода свисают спереди." },
    "ergonomics": { "score": 6, "comment": "Монитор ниже уровня глаз примерно на 5 см." },
    "cable_management": { "score": 3, "comment": "Провода видны везде. Cable management не делался вообще." },
    "atmosphere": { "score": 5, "comment": "Рабочее место, но не вдохновляющее." },
    "minimalism": { "score": 4, "comment": "Слишком много всего на столе." }
  },
  "review": "Честный и жёсткий разбор сетапа...",
  "tips": ["Конкретный совет 1", "Конкретный совет 2", "Конкретный совет 3"]
}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    tempImages.delete(imageId);

    if (!response.ok) {
      const errorText = await response.text();
      req.log.error({ status: response.status, body: errorText }, "Groq API error");
      res.status(500).json({ error: "Ошибка при обращении к AI сервису" });
      return;
    }

    const groqData = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = groqData.choices?.[0]?.message?.content;
    if (!content) {
      res.status(500).json({ error: "Пустой ответ от AI" });
      return;
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      req.log.error({ content }, "Failed to extract JSON from Groq response");
      res.status(500).json({ error: "Не удалось разобрать ответ AI" });
      return;
    }

    const analysisResult = JSON.parse(jsonMatch[0]);
    res.json(analysisResult);
  } catch (err) {
    tempImages.delete(imageId);
    req.log.error({ err }, "Error analyzing setup");
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

export default router;
