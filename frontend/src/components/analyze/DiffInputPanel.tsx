import { useCallback } from "react";

interface DiffInputPanelProps {
  value: string;
  onChange: (value: string) => void;
  onFilesDetected: (files: string[]) => void;
  description: string;
  onDescriptionChange: (desc: string) => void;
}

export default function DiffInputPanel({
  value,
  onChange,
  onFilesDetected,
  description,
  onDescriptionChange,
}: DiffInputPanelProps) {
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const text = e.clipboardData.getData("text");
      if (!text) return;
      onChange(text);
      detectChangedFiles(text);
    },
    [onChange, onFilesDetected]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      onChange(text);
      if (text.trim()) detectChangedFiles(text);
    },
    [onChange, onFilesDetected]
  );

  const detectChangedFiles = (diff: string) => {
    const files: string[] = [];
    const lines = diff.split("\n");

    for (const line of lines) {
      const match = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
      if (match) {
        const filePath = match[2];
        if (!files.includes(filePath)) {
          files.push(filePath);
        }
      }

      const headerMatch = line.match(/^--- a\/(.+)$/);
      if (headerMatch && !files.includes(headerMatch[1])) {
        files.push(headerMatch[1]);
      }
    }

    if (files.length === 0 && diff.trim().length > 0) {
      // Fallback root node if they paste plain code instead of a git diff
      files.push("src/modified_component.ts");
    }

    onFilesDetected(files);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-2 block text-xs font-medium text-white/40">
          Paste your git diff
        </label>
        <textarea
          value={value}
          onChange={handleChange}
          onPaste={handlePaste}
          placeholder={`diff --git a/auth/tokenValidator.js b/auth/tokenValidator.js
@@ -5,7 +5,7 @@
-function validateToken(tokenObj) {
+function validateToken(tokenObj, config) {`}
          className="h-40 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-xs leading-relaxed text-white placeholder:text-white/15 focus:border-[#0f62fe]/40 focus:outline-none focus:ring-1 focus:ring-[#0f62fe]/20"
          spellCheck={false}
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-white/40">
          Description (optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="e.g. Changed token validation signature"
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/15 focus:border-[#0f62fe]/40 focus:outline-none focus:ring-1 focus:ring-[#0f62fe]/20"
        />
      </div>
    </div>
  );
}
