export interface ParsedDiff {
  files: ParsedFile[];
}

export interface ParsedFile {
  filePath: string;
  hunks: DiffHunk[];
  changedFunctions: string[];
  isNew: boolean;
  isDeleted: boolean;
}

export interface DiffHunk {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  context: string[];
}

export function parseMultiFileDiff(diff: string): ParsedDiff {
  const files: ParsedFile[] = [];
  const lines = diff.split("\n");

  let currentFile: ParsedFile | null = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Match diff --git a/path b/path
    const diffHeader = line.match(/^diff --git a\/(.*?) b\/(.*?)$/);
    if (diffHeader) {
      if (currentFile) {
        files.push(currentFile);
      }
      currentFile = {
        filePath: diffHeader[2],
        hunks: [],
        changedFunctions: [],
        isNew: false,
        isDeleted: false,
      };
      i++;
      continue;
    }

    // Match new file mode
    if (line.match(/^new file mode/)) {
      if (currentFile) currentFile.isNew = true;
      i++;
      continue;
    }

    // Match deleted file mode
    if (line.match(/^deleted file mode/)) {
      if (currentFile) currentFile.isDeleted = true;
      i++;
      continue;
    }

    // Match hunk header @@ -a,b +c,d @@ optional_context
    const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@\s*(.*)$/);
    if (hunkMatch && currentFile) {
      const oldStart = parseInt(hunkMatch[1]);
      const oldCount = parseInt(hunkMatch[2] || "1");
      const newStart = parseInt(hunkMatch[3]);
      const newCount = parseInt(hunkMatch[4] || "1");
      const contextStr = hunkMatch[5] || "";

      // Extract function name from context
      const funcMatch = contextStr.match(/\b(function|class|def|const|let|var)\s+(\w+)/);
      if (funcMatch) {
        currentFile.changedFunctions.push(funcMatch[2]);
      }

      const hunk: DiffHunk = {
        oldStart,
        oldCount,
        newStart,
        newCount,
        context: [],
      };

      i++;
      while (i < lines.length && !lines[i].startsWith("@@") && !lines[i].startsWith("diff --git")) {
        hunk.context.push(lines[i]);
        i++;
      }

      // Extract function names from hunk context
      for (const ctxLine of hunk.context) {
        const ctxMatch = ctxLine.match(/^[+-]\s*(?:static\s+)?(?:async\s+)?(?:export\s+)?(?:function|class|def|const|let|var)\s+(\w+)/);
        if (ctxMatch) {
          const fn = ctxMatch[1];
          if (!currentFile.changedFunctions.includes(fn)) {
            currentFile.changedFunctions.push(fn);
          }
        }
      }

      currentFile.hunks.push(hunk);
      continue;
    }

    i++;
  }

  if (currentFile) {
    files.push(currentFile);
  }

  return { files };
}
