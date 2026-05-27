# Setup Rater

An AI-powered computer setup rater — upload a photo of your desk and get a detailed score from Groq AI across 7 categories.

## Run & Operate

- `pnpm --filter @workspace/setup-rater run dev` — run the React frontend (dev server)
- `pnpm --filter @workspace/api-server run dev` — run the Node.js API server (dev only)
- `python server.py` — run the Python Flask server (production, serves built frontend + API)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- Required env: `GROK_API_KEY` — Groq API key for AI analysis

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Framer Motion
- API (dev): Express 5 (Node.js)
- API (production/Render): Python Flask + Gunicorn
- AI: Groq API (llama-4-scout-17b-16e-instruct, multimodal)
- Build: esbuild (API server CJS bundle)

## Where things live

- `artifacts/setup-rater/` — React/Vite frontend
- `artifacts/api-server/` — Node.js Express API (used in Replit dev)
- `server.py` — Python Flask server (for Render deployment)
- `requirements.txt` — Python dependencies (Flask, Gunicorn)
- `render.yaml` — Render deployment config (Python runtime)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas

## Architecture decisions

- Dev uses Node.js Express API server; production (Render) uses Python Flask — same API surface, Flask serves built static files too.
- Groq API is called server-side; images are temporarily stored in memory and served via a temp URL for the multimodal LLM call.
- OpenAPI spec drives both React Query hook generation (frontend) and Zod schema generation (backend validation).

## Product

- Hero page: Upload a desk photo by clicking or drag-and-drop
- Analysis: Groq AI scores the setup across 7 categories (aesthetics, lighting, cleanliness, ergonomics, cable management, atmosphere, minimalism)
- Results: Overall score with animated ring, per-category breakdowns, and concrete improvement tips
- Dark/light theme toggle with sakura petal animations

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `GROK_API_KEY` must be set — the app won't analyze photos without it
- On Render: the build step runs `pnpm build` for the React frontend, then Flask serves the built static files from `artifacts/setup-rater/dist/public/`
- Re-run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec changes
