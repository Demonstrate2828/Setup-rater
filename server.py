import os
import json
import uuid
import base64
import time
import urllib.request
import urllib.error
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder="artifacts/setup-rater/dist/public", static_url_path="")
CORS(app)

temp_images = {}

def cleanup_expired():
    now = time.time()
    expired = [k for k, v in temp_images.items() if v["expires"] < now]
    for k in expired:
        del temp_images[k]

@app.route("/api/healthz")
def health():
    return jsonify({"status": "ok"})

@app.route("/api/temp/<image_id>")
def get_temp_image(image_id):
    cleanup_expired()
    entry = temp_images.get(image_id)
    if not entry or entry["expires"] < time.time():
        return jsonify({"error": "Image not found or expired"}), 404
    from flask import Response
    return Response(entry["data"], mimetype=entry["mime_type"])

@app.route("/api/analyze", methods=["POST"])
def analyze():
    cleanup_expired()

    body = request.get_json(force=True)
    if not body or "imageBase64" not in body or "mimeType" not in body:
        return jsonify({"error": "Invalid request body"}), 400

    image_base64 = body["imageBase64"]
    mime_type = body["mimeType"]

    api_key = os.environ.get("GROK_API_KEY")
    if not api_key:
        return jsonify({"error": "GROK_API_KEY не настроен"}), 500

    image_id = str(uuid.uuid4())
    image_data = base64.b64decode(image_base64)
    temp_images[image_id] = {
        "data": image_data,
        "mime_type": mime_type,
        "expires": time.time() + 300,
    }

    replit_domains = os.environ.get("REPLIT_DOMAINS", "")
    dev_domain = os.environ.get("REPLIT_DEV_DOMAIN", "")
    host = replit_domains.split(",")[0].strip() if replit_domains else dev_domain

    if host:
        image_url = f"https://{host}/api/temp/{image_id}"
    else:
        render_url = os.environ.get("RENDER_EXTERNAL_URL", "")
        if render_url:
            image_url = f"{render_url}/api/temp/{image_id}"
        else:
            image_url = f"data:{mime_type};base64,{image_base64}"

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
}"""

    payload = json.dumps({
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": image_url},
                    },
                    {
                        "type": "text",
                        "text": prompt,
                    },
                ],
            }
        ],
        "temperature": 0.3,
        "max_tokens": 2000,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as resp:
            groq_data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"Groq API error {e.code}: {error_body}")
        return jsonify({"error": "Ошибка при обращении к AI сервису"}), 500
    except Exception as e:
        print(f"Request error: {e}")
        return jsonify({"error": "Внутренняя ошибка сервера"}), 500
    finally:
        temp_images.pop(image_id, None)

    content = groq_data.get("choices", [{}])[0].get("message", {}).get("content", "")
    if not content:
        return jsonify({"error": "Пустой ответ от AI"}), 500

    import re
    match = re.search(r"\{[\s\S]*\}", content)
    if not match:
        print(f"Failed to extract JSON from: {content}")
        return jsonify({"error": "Не удалось разобрать ответ AI"}), 500

    try:
        result = json.loads(match.group(0))
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        return jsonify({"error": "Не удалось разобрать ответ AI"}), 500

    return jsonify(result)

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_spa(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
