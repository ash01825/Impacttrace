import { FileCode } from "@phosphor-icons/react";

interface ParsedFileListProps {
  files: string[];
}

export default function ParsedFileList({ files }: ParsedFileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-white/30">
        Detected {files.length} file{files.length > 1 ? "s" : ""}
      </span>
      {files.map((file) => (
        <div
          key={file}
          className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
        >
          <FileCode size={12} weight="regular" className="text-white/20 shrink-0" />
          <span className="font-mono text-xs text-white/50 truncate">{file}</span>
        </div>
      ))}
    </div>
  );
}
