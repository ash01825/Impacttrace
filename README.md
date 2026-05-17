# ImpactTrace

> **Know what breaks before you ship.** Pre-commit change intelligence — map the full blast radius of any code change in seconds.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev/)
[![Node](https://img.shields.io/badge/Node-23-green)](https://nodejs.org/)

---

## What It Does

ImpactTrace analyzes your codebase's dependency graph and uses AI to discover every file that would break from a proposed change — including **implicit dependencies** that no linter or static analysis tool can find.

**Paste a git diff. See the blast radius. Ship with confidence.**

### The Implicit Dependency Problem

Two files can share a runtime contract without ever importing each other. For example, an auth service and a payment service might both read the same JSON schema. If you change the auth service's token format, the payment service silently rejects all tokens. No import chain connects them. No test catches it. No linter flags it.

**ImpactTrace finds these invisible connections.**

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   IBM Bob IDE                     │
│         Developer writes + triggers analysis       │
└──────────────────────┬───────────────────────────┘
                       │ change context (diff + intent)
                       ▼
┌──────────────────────────────────────────────────┐
│                ImpactTrace Frontend               │
│        React 18 • TypeScript • Tailwind           │
│   ┌──────────┐  ┌────────────┐  ┌────────────┐   │
│   │ Diff     │  │ Blast      │  │ Impact     │   │
│   │ Input    │  │ Radius Map │  │ Summary    │   │
│   └──────────┘  └────────────┘  └────────────┘   │
└──────────────────────┬───────────────────────────┘
                       │ SSE stream
                       ▼
┌──────────────────────────────────────────────────┐
│                ImpactTrace Backend                │
│       Express • TypeScript • Server-Sent Events    │
│   ┌──────────┐  ┌────────────┐  ┌────────────┐   │
│   │ Repo     │  │ Prompt     │  │ Response   │   │
│   │ Scanner  │  │ Builder    │  │ Parser     │   │
│   └──────────┘  └────────────┘  └────────────┘   │
└──────────────────────┬───────────────────────────┘
                       │ OpenRouter API (free tier)
                       ▼
┌──────────────────────────────────────────────────┐
│        NVIDIA Nemotron Super 120B (free)          │
│         1M context • Structured JSON output        │
│      Discovers direct, transitive, behavioral      │
│           contract, and shared-state impacts       │
└──────────────────────────────────────────────────┘
```

### Analysis Pipeline

1. **Repo Scanner** — Clones any GitHub repo (depth=1), parses all files for imports/exports, builds a dependency graph mapping every file to what it imports and what imports it
2. **Prompt Builder** — Constructs a structured prompt containing the full dependency graph, changed files, and diff context
3. **AI Inference** — Sends to NVIDIA Nemotron via OpenRouter (free tier). The model traces impact through 4 phases: direct callers → transitive callers → behavioral contracts → shared state
4. **Streaming Response** — Results stream back via Server-Sent Events, nodes appear progressively on the blast radius map
5. **Analysis History** — Every analysis saved to localStorage with timestamp, diff, and results for comparison

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| AI Inference | NVIDIA Nemotron Super 120B via OpenRouter | Free tier, 1M context window, follows JSON instructions reliably |
| Frontend | React 18 + TypeScript + Vite | Fast builds, strict type safety, modern React features |
| Graph Visualization | React Flow + Dagre | Production-grade node graph with auto-layout |
| Animations | Framer Motion | Progressive node appearance, smooth transitions |
| Styling | Tailwind CSS | Utility-first, dark theme optimized |
| State | Zustand + localStorage | Lightweight state management with persistence |
| Backend | Express + TypeScript | Simple, fast, well-typed API |
| Git Operations | simple-git | Clone repos (depth=1) for scanning |
| Package Manager | pnpm | Fast, disk-efficient monorepo support |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- OpenRouter API key (free — [get one here](https://openrouter.ai/keys))

### Setup

```bash
# Clone the repo
git clone https://github.com/ash01825/ImpactTrace
cd ImpactTrace

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env and paste your OpenRouter API key
```

### Run

```bash
# Starts backend (port 3001) + frontend (port 5173)
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) — the landing page loads.

### Usage Flow

1. **Import a repository** — Go to Dashboard, paste a GitHub URL, click Scan
2. **Paste your diff** — Navigate to Analyze, paste a git diff into the textarea
3. **Compute impact** — Click "Compute Impact", watch the analysis stream live
4. **Explore results** — The blast radius map shows:
   - **Blue nodes** — Changed files (center of the blast)
   - **Colored nodes** — Affected files (teal=low, amber=medium, red=high risk)
   - **Dashed edges** — Behavioral contracts (invisible dependencies)
   - **Solid edges** — Direct/transitive import relationships
5. **Export** — Download a Markdown report or copy to clipboard

### Example Diff

```diff
@@ -5,7 +5,7 @@
-function validateToken(tokenObj) {
+function validateToken(tokenObj, config) {
```

This single-line change to a function signature triggers analysis that discovers the behavioral contract between auth and payment services through a shared JSON schema — a dependency no linter would catch.

---

## Why We Switched from IBM Watsonx

We initially built ImpactTrace on **IBM watsonx.ai Granite (granite-3-8b-instruct)**. While functional, Granite had limitations:

| Issue | Impact |
|---|---|
| Markdown output | Granite ignored JSON instructions and returned markdown, requiring a custom parser |
| Output quality | Analysis often referenced files from deleted code rather than the actual dependency graph |
| Token limits | 4K token limit restricted the dependency graph we could send |
| Vendor lock-in | Required IBM Cloud account with active project |

**The switch to NVIDIA Nemotron via OpenRouter solved all of these:**

- **1M context window** — We send the full dependency graph with room to spare
- **JSON adherence** — Nemotron follows output format instructions reliably
- **Free tier** — Zero cost, no credit card required
- **Model flexibility** — OpenRouter gives us access to dozens of free models; swap one line to change models

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/analyze` | Submit diff for analysis, receives SSE stream |
| `POST` | `/api/clone-and-scan` | Clone and scan a GitHub repo |
| `POST` | `/api/scan-repo` | Scan a local filesystem path |
| `GET` | `/api/health` | Health check |

### SSE Event Format

```
event: phase
data: {"phase":"indexing","label":"Scanning repository..."}

event: phase
data: {"phase":"identifying_direct","label":"Identifying direct dependencies"}

event: impact_path
data: {"component":"src/stores/connection-store.ts","dependencyType":"behavioral_contract","riskLevel":"high","explanation":"..."}

event: complete
data: {"overallRisk":"high","affectedCount":14,"summary":{...}}
```

---

## Project Structure

```
ImpactTrace/
├── backend/                  # Express + TypeScript API
│   └── src/
│       ├── routes/           # API endpoints (analyze, scan, health)
│       ├── services/         # AI client, prompt builder, repo scanner
│       ├── parsers/          # Response parser (JSON + markdown fallback)
│       └── types/            # Shared TypeScript types
├── frontend/                 # React 18 + Vite
│   └── src/
│       ├── components/       # UI components
│       │   ├── analysis/     # History, health dashboard, report export
│       │   ├── analyze/      # Diff input, file list
│       │   ├── graph/        # React Flow blast radius map
│       │   ├── summary/      # Impact summary panel
│       │   └── layout/       # App shell, navigation
│       ├── hooks/            # SSE streaming hook
│       ├── store/            # Zustand state + localStorage persistence
│       └── routes/           # Landing, Dashboard, Analyze pages
├── demo-repo/                # Example monorepo for testing
├── .env.example              # Environment template
└── README.md
```

---

## Powered by IBM Bob IDE

ImpactTrace is built to integrate with **IBM Bob IDE** — the development environment that reads your entire repository, understands intent, and explains the logic behind every dependency. When a developer makes a change in Bob IDE, ImpactTrace receives full repository context including Bob's understanding of the change's intent, enabling deeper and more accurate impact analysis.

---

## License

MIT
