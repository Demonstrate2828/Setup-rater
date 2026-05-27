# Setup Rater — Deploy

Готовая папка для деплоя. Только Python, никакого Node.js.

## Структура
```
deploy/
├── server.py        # Flask сервер (API + раздача фронта)
├── requirements.txt # зависимости Python
├── Procfile         # для Heroku / Railway
├── render.yaml      # для Render
└── static/          # собранный React фронтенд
```

## Деплой на Render

1. Подключи GitHub репо на render.com
2. Render автоматически найдёт `render.yaml`
3. Добавь переменную окружения: `GROK_API_KEY` = твой ключ с console.groq.com
4. Deploy

## Деплой на Railway / Heroku

```bash
cd deploy
# Добавь GROK_API_KEY в переменные окружения платформы
```

## Локальный запуск

```bash
cd deploy
pip install -r requirements.txt
GROK_API_KEY=твой_ключ python server.py
```
