# API Server

REST API на базе Express 5, TypeScript, PostgreSQL.

## Запуск

```bash
pnpm --filter @workspace/api-server run dev
```

## Переменные окружения

| Переменная     | Описание                          |
|----------------|-----------------------------------|
| `PORT`         | Порт сервера (обязательно)        |
| `DATABASE_URL` | Строка подключения к PostgreSQL   |

## Команды

```bash
pnpm run typecheck                          # проверка типов
pnpm run build                              # сборка всех пакетов
pnpm --filter @workspace/api-spec run codegen  # генерация кода из OpenAPI
pnpm --filter @workspace/db run push        # применить схему БД (только dev)
```

## Структура проекта

```
├── artifacts/
│   └── api-server/          # Express-сервер (точка входа)
├── lib/
│   ├── api-spec/            # OpenAPI-спецификация (источник истины)
│   ├── api-zod/             # Zod-схемы, сгенерированные из OpenAPI
│   └── db/                  # Схема БД и подключение (Drizzle ORM)
├── scripts/                 # Утилитарные скрипты
├── render.yaml              # Конфигурация деплоя на Render
└── pnpm-workspace.yaml      # Настройки monorepo
```

## Стек

- **Runtime:** Node.js 24, TypeScript 5.9
- **API:** Express 5, Pino (логирование)
- **БД:** PostgreSQL + Drizzle ORM
- **Валидация:** Zod, drizzle-zod
- **Codegen:** Orval (из OpenAPI-спецификации)
- **Сборка:** esbuild

## Деплой (Render)

Конфигурация в `render.yaml`. Render автоматически подхватит её из корня репозитория.
