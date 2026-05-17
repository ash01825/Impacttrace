import { Link } from "react-router-dom";
import { ArrowRight, GitBranch, Terminal, ShieldCheck, Robot } from "@phosphor-icons/react";

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-bg-primary text-text-primary">
      {/* Navbar */}
      <nav className="border-b border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-text-primary text-bg-primary flex items-center justify-center font-mono text-xs font-bold">
              IT
            </div>
            <span className="font-semibold tracking-tight">ImpactTrace</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://bob.ibm.com/" target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1.5 text-[#0f62fe] bg-[#0f62fe]/10 px-2.5 py-1 rounded-full font-medium border border-[#0f62fe]/20 hidden sm:flex hover:bg-[#0f62fe]/20 transition-colors">
              <Robot size={14} weight="fill" />
              Powered by IBM Bob IDE
            </a>
            <Link to="/dashboard" className="btn-primary text-sm rounded-sm">
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-dot opacity-40 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        
        <div className="relative mx-auto max-w-6xl px-6 pt-32 pb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 border border-zinc-700 px-3 py-1 mb-8 rounded-full text-xs font-mono text-text-secondary">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live impact analysis
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tighter leading-[1.1] mb-6">
              Know exactly what breaks<br />
              <span className="text-text-muted">before you commit.</span>
            </h1>
            
            <p className="text-lg text-text-secondary max-w-2xl mb-10 leading-relaxed">
              Drop in a Git diff. ImpactTrace maps the full blast radius of your code changes, catching hidden behavioral contracts and implicit dependencies that static analysis tools miss.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/dashboard" className="btn-primary rounded-sm flex items-center gap-2 text-base px-6 py-3">
                Start Analysis <ArrowRight weight="bold" />
              </Link>
              <div className="font-mono text-xs text-text-muted border border-zinc-800 px-4 py-3 bg-bg-surface rounded-sm flex items-center gap-2">
                <span className="text-text-secondary">$</span> impacttrace analyze
              </div>
            </div>
          </div>
        </div>

        {/* Features / Architecture Grid */}
        <div className="mx-auto max-w-6xl px-6 py-20 border-t border-zinc-800">
          <div className="grid md:grid-cols-3 gap-px bg-border-subtle border border-zinc-800">
            {[
              {
                icon: GitBranch,
                title: "Deep Context",
                desc: "Reads your entire repository to understand intent, not just syntax.",
              },
              {
                icon: ShieldCheck,
                title: "Implicit Dependencies",
                desc: "Finds shared state and behavioral contracts invisible to linters.",
              },
              {
                icon: Terminal,
                title: "Actionable Output",
                desc: "Generates clear markdown reports explaining why code fails and how to fix it.",
              }
            ].map((f) => (
              <div key={f.title} className="bg-bg-primary p-8">
                <f.icon size={24} className="text-text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-text-muted">
          <div>ImpactTrace &copy; 2026</div>
          <a href="https://bob.ibm.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#0f62fe] hover:underline">
            <Robot size={14} weight="fill" />
            Powered by IBM Bob IDE
          </a>
        </div>
      </footer>
    </div>
  );
}
