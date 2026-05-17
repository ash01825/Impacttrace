interface DiffViewerProps {
  diff: string;
}

export default function DiffViewer({ diff }: DiffViewerProps) {
  const lines = diff.split("\n");

  return (
    <div className="overflow-x-auto rounded-lg border border-white/5 bg-white/[0.02]">
      <pre className="p-4 text-xs font-mono leading-relaxed text-text-primary">
        {lines.map((line, i) => {
          let lineClass = "text-zinc-500";
          if (line.startsWith("+")) lineClass = "text-risk-low";
          else if (line.startsWith("-")) lineClass = "text-risk-high";
          else if (line.startsWith("@@")) lineClass = "text-amber-400";

          return (
            <div key={i} className={lineClass}>
              {line || " "}
            </div>
          );
        })}
      </pre>
    </div>
  );
}
