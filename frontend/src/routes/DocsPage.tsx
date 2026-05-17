import { BookOpen, Code, Cpu, HardDrives, Play, Robot, Target, ShareNetwork, TerminalWindow } from "@phosphor-icons/react";

export default function DocsPage() {
  return (
    <div className="flex h-full flex-col bg-bg-primary overflow-hidden">
      {/* Header */}
      <header className="border-b border-zinc-800 px-8 py-6 flex items-center justify-between bg-bg-surface shrink-0">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Documentation</h1>
          <p className="text-sm text-text-muted mt-1">ImpactTrace architecture, usage, and methodology.</p>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-8 py-12 space-y-16">
          
          {/* Section: What & Why */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-[#0f62fe] border-b border-zinc-800 pb-2">
              <Target size={24} weight="fill" />
              <h2 className="text-lg font-semibold text-text-primary tracking-tight">The Problem & Our Solution</h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="border border-zinc-800 bg-bg-surface p-6">
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">The Problem</h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Modern microservices and monorepos are riddled with <strong>implicit dependencies</strong>. Static analysis tools (like linters or AST parsers) can only find direct `import` statements. They completely miss behavioral contracts, shared database states, and assumed event payloads. When a developer changes a file, they don't know the true "blast radius" until CI fails or production breaks.
                </p>
              </div>
              <div className="border border-zinc-800 bg-bg-surface p-6">
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">The Solution</h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  <strong>ImpactTrace</strong> uses AI inference to understand code <em>intent</em>. By feeding the entire repository context alongside a specific git diff into <strong>watsonx.ai Granite</strong>, we can trace logical paths and behavioral contracts that don't exist as physical imports. We map exactly what will break before you even commit.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Architecture */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-[#0f62fe] border-b border-zinc-800 pb-2">
              <Cpu size={24} weight="fill" />
              <h2 className="text-lg font-semibold text-text-primary tracking-tight">Architecture & Technology</h2>
            </div>

            <div className="prose prose-invert prose-sm max-w-none text-text-secondary leading-relaxed">
              <p className="mb-4">
                ImpactTrace is built for the <strong>IBM TechXchange Hackathon</strong>. It operates entirely off a real-time Server-Sent Events (SSE) streaming architecture to provide instant feedback as the AI reasoning engine processes the codebase.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-px bg-zinc-800 border border-zinc-800">
              <div className="bg-bg-primary p-6">
                <Robot size={24} className="text-[#0f62fe] mb-4" weight="fill" />
                <h4 className="font-semibold text-sm text-text-primary mb-2">IBM Bob IDE</h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  Bob IDE acts as the intelligence layer that reads the entire repository. It understands the project's logic, architecture, and intent, preparing the full context payload before the diff is analyzed.
                </p>
              </div>
              <div className="bg-bg-primary p-6">
                <HardDrives size={24} className="text-text-primary mb-4" />
                <h4 className="font-semibold text-sm text-text-primary mb-2">watsonx.ai Granite</h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  The backend constructs a massive prompt containing the Bob IDE context and the user's diff. It queries <code>granite-3-8b-instruct</code> to perform deep reasoning to uncover transitive callers and implicit behavioral contracts.
                </p>
              </div>
              <div className="bg-bg-primary p-6">
                <ShareNetwork size={24} className="text-text-primary mb-4" />
                <h4 className="font-semibold text-sm text-text-primary mb-2">SSE Streaming UI</h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  Instead of waiting for a 30-second LLM generation, the Node.js backend streams a structured JSON event protocol directly into the React Flow frontend, building the blast radius map progressively node-by-node.
                </p>
              </div>
            </div>
          </section>

          {/* Section: How to use */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-[#0f62fe] border-b border-zinc-800 pb-2">
              <BookOpen size={24} weight="fill" />
              <h2 className="text-lg font-semibold text-text-primary tracking-tight">Usage Guide</h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  step: 1,
                  title: "Import Repository Context",
                  desc: "Navigate to the Import page. Paste a GitHub URL, local path, or simply click 'Load Demo Repository' to load a pre-configured monorepo with engineered implicit dependencies.",
                  icon: TerminalWindow
                },
                {
                  step: 2,
                  title: "Submit Code Diff",
                  desc: "Go to the Analyze page. Paste your proposed Git diff (or code snippet). Provide a brief human-readable description of what you are trying to achieve (your intent).",
                  icon: Code
                },
                {
                  step: 3,
                  title: "Watch the Live Trace",
                  desc: "Click 'Compute Impact'. Watch as the UI progressively draws nodes representing direct, transitive, and implicit dependencies. High-risk nodes are outlined in red.",
                  icon: Play
                }
              ].map((s) => (
                <div key={s.step} className="flex gap-4 p-4 border border-zinc-800 bg-bg-surface">
                  <div className="flex shrink-0 h-8 w-8 items-center justify-center bg-zinc-800 text-text-primary font-mono text-xs font-bold">
                    {s.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-text-primary mb-1 flex items-center gap-2">
                      <s.icon size={16} /> {s.title}
                    </h4>
                    <p className="text-sm text-text-secondary">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Design Philosophy */}
          <section className="space-y-6 pb-20">
            <div className="flex items-center gap-3 text-[#0f62fe] border-b border-zinc-800 pb-2">
              <Code size={24} weight="fill" />
              <h2 className="text-lg font-semibold text-text-primary tracking-tight">Design Philosophy</h2>
            </div>
            
            <div className="border border-zinc-800 p-6">
              <p className="text-sm leading-relaxed text-text-secondary">
                ImpactTrace rejects the generic "AI Slop" aesthetic (heavy gradients, glassmorphism, excessive glowing orbs) commonly seen in hackathon projects. Instead, it is designed as a <strong>premium, high-signal B2B enterprise tool</strong>. 
                <br /><br />
                The UI utilizes a stark, utilitarian color palette (Zinc 950/50), sharp 1px borders, dense data layouts, and strict typography (Inter and JetBrains Mono) to ensure the developer focuses purely on the data: the blast radius of their code.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
