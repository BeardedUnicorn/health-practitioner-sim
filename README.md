# Healthcare Training Simulator

A local-first training simulator for healthcare communication and diagnostic practice. The app uses an OpenAI-compatible chat completions API to generate realistic patient or client scenarios, stream roleplayed responses, run assessments, and evaluate each completed session.

The frontend is built with React, TypeScript, and Vite. It can run as a web app during development or as a desktop app through Tauri 2.

## Features

- Profession-specific training modes for nurses, psychiatrists, psychologists, therapists, doulas, pregnancy partners, and couples therapists.
- Configurable case setup with category, difficulty, clinical setting, guided or exam mode, and optional turn limits.
- Streaming patient or client conversations backed by `/v1/chat/completions`.
- Assessment toolkits tailored to each profession, including vitals, mental status exam items, therapy interventions, and relationship dynamics prompts.
- Inline coaching and coach panel suggestions for guided sessions.
- Session evaluation with score breakdowns, strengths, gaps, safety flags, suggested actions, and saved progress.
- Local progress tracking with session history, profession filters, recent performance, and practice streaks.
- Tauri runtime information adapter with browser fallback for web development.

## Requirements

- Node.js 20 or newer
- Yarn
- Rust and Cargo, required for Tauri desktop commands
- A local or remote OpenAI-compatible API that supports `POST /v1/chat/completions`

The default API settings point at a local LM Studio-style endpoint:

- API URL: `http://localhost:1234/v1`
- API key: empty
- Model: `qwen/qwen3-4b-2507`

You can change these values from the in-app Settings modal.

## Getting Started

Install dependencies:

```bash
yarn install
```

Start the web development server:

```bash
yarn dev
```

Open the printed Vite URL, usually `http://localhost:5173`.

Run the desktop app in development mode:

```bash
yarn tauri dev
```

Build the web app:

```bash
yarn build
```

Build desktop bundles:

```bash
yarn tauri build
```

## API Configuration

The simulator expects an OpenAI-compatible chat completions API. Requests are sent to:

```text
{API_URL}/chat/completions
```

The app uses the configured model name for scenario generation, live conversation streaming, assessments, coaching, and evaluations. If your provider requires authentication, add the API key in Settings. The key is sent as a bearer token.

For local model servers, make sure CORS is enabled for browser development. The Tauri content security policy allows localhost connections and HTTPS remote endpoints.

## Scripts

```bash
yarn dev        # Start Vite
yarn build      # Type-check and build the frontend
yarn preview    # Preview the built frontend
yarn tauri      # Run Tauri CLI commands
yarn lint       # Run ESLint
yarn test       # Run Vitest in watch mode
yarn test:run   # Run Vitest once
yarn verify     # Run frontend, Rust, and Tauri quality gates
```

`yarn verify` runs linting, frontend build, Vitest, Rust formatting checks, Clippy, Cargo tests, and Cargo check.

## Project Structure

```text
src/
  app/                    App-level state, routing, and shell composition
  components/             Shared screens and modal components
  config/                 Profession definitions, prompts, and toolkits
  features/
    coach/                Guided-session coach state, hooks, and UI
    session/              Session state, runtime hooks, toolbar, workspace, composer, conversations
  integrations/tauri/     Runtime information adapter
  shared/llm/             Chat completions client, streaming parser, JSON parser
  styles/                 Global and shared styles
  utils/                  Local progress and preference storage
src-tauri/
  src/                    Tauri Rust entry point and commands
  capabilities/           Tauri permissions
  tauri.conf.json         Desktop app configuration
docs/audit/               Architecture and verification audit notes
```

## Progress Data

Session progress and case setup preferences are stored in browser `localStorage`:

- `healthcare-trainer-progress`
- `healthcare-trainer-preferences`

Progress is local to the browser or Tauri webview profile. The app keeps the most recent 100 session records.

## Development Notes

- Case behavior is driven by `src/config/professionConfig.ts`.
- Shared LLM request and streaming behavior lives in `src/shared/llm/`.
- Session orchestration lives in `src/features/session/hooks/useSessionRuntime.ts`.
- Guided coaching logic lives in `src/features/coach/hooks/useCoachSuggestions.ts`.
- Tauri exposes a small `runtime_info` command from `src-tauri/src/lib.rs`.

## License

MIT
