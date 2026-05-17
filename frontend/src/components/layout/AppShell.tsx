import { ReactNode } from "react";

interface AppShellProps {
  header: ReactNode;
  leftPanel: ReactNode;
  center: ReactNode;
  rightPanel: ReactNode | null;
}

export default function AppShell({ header, leftPanel, center, rightPanel }: AppShellProps) {
  return (
    <div className="flex h-screen flex-col bg-bg-primary">
      <header className="flex h-14 items-center justify-between border-b border-white/5 px-6">
        {header}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 flex-shrink-0 border-r border-white/5 overflow-y-auto">
          {leftPanel}
        </aside>

        <main className="flex-1 relative">{center}</main>

        {rightPanel && (
          <aside className="w-80 flex-shrink-0 border-l border-white/5 overflow-y-auto">
            {rightPanel}
          </aside>
        )}
      </div>
    </div>
  );
}
