import { useState, useCallback, useRef } from "react";
import type { GraniteResponse, ImpactPath, PhaseData, ParsedDiff, RepoContext } from "@/types";

interface AnalysisParams {
  diff: string;
  description: string;
  repoContext: RepoContext;
  parsedFiles?: ParsedDiff;
}

interface UseAnalysisStreamReturn {
  impactPaths: ImpactPath[];
  currentPhase: PhaseData | null;
  response: GraniteResponse | null;
  isStreaming: boolean;
  error: string | null;
  startAnalysis: (params: AnalysisParams) => void;
  reset: () => void;
}

export function useAnalysisStream(): UseAnalysisStreamReturn {
  const [impactPaths, setImpactPaths] = useState<ImpactPath[]>([]);
  const [currentPhase, setCurrentPhase] = useState<PhaseData | null>(null);
  const [response, setResponse] = useState<GraniteResponse | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startAnalysis = useCallback((params: AnalysisParams) => {
    setIsStreaming(true);
    setError(null);
    setImpactPaths([]);
    setResponse(null);

    abortRef.current = new AbortController();

    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: abortRef.current.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Analysis failed: ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) {
          throw new Error("No response stream available");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {

          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              continue;
            }
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                const eventType = getLastEventType(lines, line);

                if (eventType === "error" || data.message) {
                  setError(data.message || "Analysis error");
                  setIsStreaming(false);
                  return;
                }
                if (eventType === "phase" || data.phase) {
                  setCurrentPhase(data as PhaseData);
                } else if (eventType === "impact_path" || data.component) {
                  setImpactPaths((prev) => [...prev, data as ImpactPath]);
                } else if (eventType === "complete" || data.summary) {
                  setResponse(data as GraniteResponse);
                  setIsStreaming(false);
                }
              } catch {
                // Skip unparseable lines
              }
            }
          }
        }

        setIsStreaming(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Analysis failed");
        setIsStreaming(false);
      });
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setImpactPaths([]);
    setCurrentPhase(null);
    setResponse(null);
    setIsStreaming(false);
    setError(null);
  }, []);

  return {
    impactPaths,
    currentPhase,
    response,
    isStreaming,
    error,
    startAnalysis,
    reset,
  };
}

function getLastEventType(lines: string[], currentLine: string): string {
  const currentIndex = lines.indexOf(currentLine);
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (lines[i].startsWith("event: ")) {
      return lines[i].slice(7).trim();
    }
  }
  return "";
}
