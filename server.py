import os
import json
import re
import urllib.request
import urllib.error
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder="static", static_url_path="")

@app.route("/api/healthz")
def health():
    return jsonify({"status": "ok"})

@app.route("/api/analyze", methods=["POST"])
def analyze():
    body = request.get_json(force=True)
    if not body or "imageBase64" not in body or "mimeType" not in body:
        return jsonify({"error": "Invalid request body"}), 400

    image_base64 = body["imageBase64"]
    mime_type    = body["mimeType"]
    image_url    = f"data:{mime_type};base64,{image_base64}"

    api_key = os.environ.get("GROK_API_KEY")
    if not api_key:
        return jsonify({"error": "GROK_API_KEY не настроен"}), 500

    prompt = """Ты — беспощадный, жёсткий критик компьютерных сетапов с 15-летним опытом. Ты видел тысячи сетапов уровня студии и не прощаешь посредственность. Твоя задача — честная, резкая, объективная оценка без лишней дипломатии.

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
- напиши резкий, конкретный комментарий на русском языке

После этого:
- поставь общую взвешенную оценку
- напиши подробный обзор в стиле жёсткого критика
- дай 3-5 конкретных советов по улучшению

Отвечай ТОЛЬКО в JSON формате:
{
  "overall_score": 5.2,
  "categories": {
    "aesthetics":        { "score": 6, "comment": "..." },
    "lighting":          { "score": 4, "comment": "..." },
    "cleanliness":       { "score": 5, "comment": "..." },
    "ergonomics":        { "score": 6, "comment": "..." },
    "cable_management":  { "score": 3, "comment": "..." },
    "atmosphere":        { "score": 5, "comment": "..." },
    "minimalism":        { "score": 4, "comment": "..." }
  },
  "review": "...",
  "tips": ["совет 1", "совет 2", "совет 3"]
}"""

    payload = json.dumps({
        "model": "meta-llama/llama-4-maverick-17b-128e-instruct",
        "messages": [{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": image_url}},
                {"type": "text",      "text": prompt},
            ],
        }],
        "temperature": 0.3,
        "max_tokens":  2000,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=payload,
        headers={
            "Content-Type":  "application/json",
            "Authorization": f"Bearer {api_key}",
            "User-Agent":    "Mozilla/5.0 (compatible; SetupRater/1.0)",
            "Accept":        "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as resp:
            groq_data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"Groq error {e.code}: {err}")
        return jsonify({"error": f"Ошибка AI сервиса: {err}"}), 500
    except Exception as e:
        print(f"Request error: {e}")
        return jsonify({"error": "Внутренняя ошибка"}), 500

    content = groq_data.get("choices", [{}])[0].get("message", {}).get("content", "")
    if not content:
        return jsonify({"error": "Пустой ответ от AI"}), 500

    match = re.search(r"\{[\s\S]*\}", content)
    if not match:
        return jsonify({"error": "Не удалось разобрать ответ AI"}), 500

    try:
        return jsonify(json.loads(match.group(0)))
    except json.JSONDecodeError:
        return jsonify({"error": "Не удалось разобрать ответ AI"}), 500

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_spa(path):
    full = os.path.join(app.static_folder, path)
    if path and os.path.exists(full):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
