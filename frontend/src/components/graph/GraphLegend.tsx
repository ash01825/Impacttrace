import { ShieldCheck, Warning, WarningCircle, Circle } from "@phosphor-icons/react";

export default function GraphLegend() {
  return (
    <div className="absolute bottom-5 left-5 z-10 rounded-xl border border-white/6 bg-bg-primary/90 px-4 py-3.5 backdrop-blur-xl">
      <div className="mb-3 text-2xs font-semibold uppercase tracking-widest text-text-muted">Legend</div>
      <div className="space-y-2">
        {[
          { icon: Circle, color: "#0f62fe", label: "Changed file", size: 8 },
          { icon: ShieldCheck, color: "#2dd4bf", label: "Low risk", size: 10 },
          { icon: Warning, color: "#f59e0b", label: "Medium risk", size: 10 },
          { icon: WarningCircle, color: "#ef4444", label: "High risk", size: 10 },
        ].map(({ icon: Icon, color, label, size }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon size={size} weight="fill" style={{ color }} />
            <span className="text-2xs text-text-muted">{label}</span>
          </div>
        ))}

        <div className="my-2 border-t border-white/6" />

        <div className="flex items-center gap-2">
          <div className="h-px w-4 bg-white/30" />
          <span className="text-2xs text-text-muted">Direct</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4" style={{ height: 1, borderTop: "1px dashed rgba(255,255,255,0.2)" }} />
          <span className="text-2xs text-text-muted">Implicit contract</span>
        </div>
      </div>
    </div>
  );
}
