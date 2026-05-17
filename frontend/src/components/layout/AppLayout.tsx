import { Outlet, Link, useLocation } from "react-router-dom";
import { ChartBar, Scan, Robot, BookOpen } from "@phosphor-icons/react";

const NAV_ITEMS = [
  { to: "/dashboard", icon: Scan, label: "Import" },
  { to: "/analyze", icon: ChartBar, label: "Analyze" },
  { to: "/docs", icon: BookOpen, label: "Documentation" },
];

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-zinc-800 bg-bg-surface">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 border-b border-zinc-800 px-5 py-4">
          <div className="flex h-6 w-6 items-center justify-center bg-text-primary text-bg-primary font-mono text-xs font-bold">
            IT
          </div>
          <div className="font-semibold tracking-tight text-sm">ImpactTrace</div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          <div className="px-3 pb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
            Menu
          </div>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors rounded-sm ${
                  active
                    ? "bg-bg-elevated text-text-primary font-medium border-l-2 border-text-primary"
                    : "text-text-secondary hover:bg-bg-primary hover:text-text-primary border-l-2 border-transparent"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Minimal Footer Badge */}
        <div className="p-4 border-t border-zinc-800">
          <a href="https://bob.ibm.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-text-muted px-2 py-1.5 bg-[#0f62fe]/10 text-[#0f62fe] border border-[#0f62fe]/20 rounded-sm font-medium hover:bg-[#0f62fe]/20 transition-colors">
            <Robot size={16} weight="fill" />
            Powered by IBM Bob IDE
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
