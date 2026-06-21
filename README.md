<div align="center">
  <div style="font-family: monospace; font-size: 24px; font-weight: bold; background: #000; color: #fff; display: inline-block; padding: 4px 8px; margin-bottom: 16px;">
    IT
  </div>
  <h1>ImpactTrace AI Engine</h1>
  <p><strong>Know exactly what breaks before you commit.</strong></p>
  <p>A sophisticated pre-commit change intelligence platform that maps the full blast radius of any proposed code change. By reading the entire repository context, ImpactTrace catches implicit behavioral contracts and shared state dependencies that traditional static analysis tools miss.</p>
</div>

---

## 🧠 The Problem & Our Solution

**The Problem:** Traditional linters and IDEs only understand *explicit* dependencies (e.g., `import X from Y`). If you change a generic token validation schema, your IDE tells you it's safe. But at runtime, a completely separate microservice that shares that schema will silently fail.

**The Solution:** The **ImpactTrace AI Engine**. We built a hybrid architecture that combines deterministic static analysis (for guaranteed direct dependencies) with dynamic LLM reasoning (for implicit contracts and behavioral state).

When you paste a Git diff, ImpactTrace:
1. Clones and statically analyzes your entire repository.
2. Builds a comprehensive dependency graph.
3. Feeds the graph + the diff into the AI Engine.
4. Streams back a live, visual blast radius map highlighting explicit **and implicit** breakages.

---

## 🏗 System Architecture

ImpactTrace is built with a modern, decoupled architecture designed for high-speed streaming inference.

```mermaid
graph TB
    subgraph "Developer Local Environment"
        DEV[Developer Workflow<br/>Generates Git Diff]
    end

    subgraph "Frontend Engine (React + TypeScript)"
        APP[App Core]
        APP --> INPUT[Diff Parser & File Detector]
        APP --> GRAPH[React Flow Engine<br/>Live Node Rendering]
        APP --> DETAIL[AI Insight Panel<br/>Remediation Guidance]
        APP --> STREAM[useAnalysisStream Hook]
    end

    subgraph "Backend Engine (Node + Express)"
        API[Express SSE Server]
        SCANNER[Repo Scanner<br/>AST & Import Tracing]
        API --> SCANNER
        PROMPT[Context Aggregator<br/>Prompt Construction]
        API --> PROMPT
        CLIENT[AI Streaming Client<br/>Retry & Fault Tolerance]
        PROMPT --> CLIENT
    end

    subgraph "AI Intelligence Layer"
        LLM[ImpactTrace AI Engine<br/>LLM Inference]
    end

    DEV -->|1. Submit Diff| INPUT
    INPUT -->|2. POST /api/analyze| API
    SCANNER -->|3. Build Repo Context| PROMPT
    PROMPT -->|4. Request Inference| LLM
    LLM -->|5. Stream Data (SSE)| CLIENT
    CLIENT -->|6. Render Graph Nodes| STREAM
```

### Key Architectural Highlights
* **Streaming Server-Sent Events (SSE):** Because deep reasoning takes time, the backend streams tokens back to the frontend in real-time. The `useAnalysisStream` hook parses these chunks on the fly and renders nodes progressively.
* **Fault-Tolerant AI Client:** The AI client includes built-in retry logic, exponential backoff, and strict JSON fallback parsing. If the LLM hallucinates markdown wrappers or malformed JSON, the `graniteParser.ts` sanitizes and repairs it before the UI breaks.
* **Hybrid Context Resolution:** The backend `repoScanner.ts` uses static analysis to resolve local paths, map `index.ts` exports, and build a deterministic skeleton graph before asking the AI to find the behavioral links.

---

## ⚡ Core Features

- **Implicit Contract Detection:** Discovers shared schemas, configuration formats, and database models that connect microservices without explicit imports.
- **Dynamic Blast Radius Maps:** Visualizes the impact using React Flow, with nodes color-coded by risk level and dependency type (Direct, Transitive, Behavioral, Shared State).
- **Actionable Remediation:** Doesn't just tell you what breaks—tells you *how* to fix it before you commit.
- **Automated Markdown Reports:** Generates clean, formatted PR-ready reports summarizing the AI's findings.
- **Live Repo Scanning:** Supports cloning and indexing public GitHub repositories on the fly.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- OpenRouter API Key (Provides access to the LLM backend)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/ImpactTrace.git
cd ImpactTrace

# 2. Install dependencies (monorepo setup)
pnpm install

# 3. Configure Environment
cp .env.example .env
# Open .env and add your OPENROUTER_API_KEY
```

### Running the Application

ImpactTrace uses a pnpm workspace to run both the frontend and backend concurrently.

```bash
# Start both servers
pnpm dev
```

- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3001](http://localhost:3001)

---

## 🧪 Running a Demo Scenario

To see the true power of the AI Engine, try this demo:

1. Navigate to **[http://localhost:5173/dashboard](http://localhost:5173/dashboard)**.
2. Click **Load Demo Repository** under the Quick Start section.
3. Once the context is indexed, click **Analyze**.
4. Paste the following diff into the input panel:

```diff
diff --git a/services/auth/tokenValidator.js b/services/auth/tokenValidator.js
--- a/services/auth/tokenValidator.js
+++ b/services/auth/tokenValidator.js
@@ -10,7 +10,7 @@
-export function validateToken(tokenObj) {
+export function validateToken(tokenObj, strictMode = false) {
     if (!tokenObj.exp) return false;
     
     // ... validation logic
```
5. Click **Compute Impact**.
6. **Watch the magic:** You will see the AI Engine flag the Payment Service as high risk. Even though the Payment Service does not import `tokenValidator.js`, the AI understands they share an *implicit schema contract* that was just altered.

---

## 🛠 Tech Stack

- **Inference:** OpenRouter LLM API (Nemotron/Granite Models)
- **Frontend UI:** React 18, Tailwind CSS, Framer Motion, Radix UI/Shadcn
- **Graph Visualization:** React Flow, Dagre (Auto-layout)
- **Backend API:** Node.js, Express, TypeScript, Server-Sent Events (SSE)
- **Tooling:** Vite, pnpm Workspaces, ESLint

---

## 📄 License

MIT License. See `LICENSE` for more information.
