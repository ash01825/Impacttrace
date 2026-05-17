import { useNavigate } from "react-router-dom";
import { useAnalysisStore } from "../store/analysisStore";
import { ArrowLeft, Scan } from "@phosphor-icons/react";
import App from "../App";

export default function AnalyzePage() {
  const { currentRepoContext, currentRepoName } = useAnalysisStore();
  const navigate = useNavigate();

  if (!currentRepoContext) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-white/5 px-8 py-5">
          <h1 className="font-sans text-lg font-semibold tracking-tight">
            Analyze
          </h1>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02]">
            <Scan size={28} weight="regular" className="text-white/20" />
          </div>
          <h2 className="font-sans text-lg font-semibold">No repository selected</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/40">
            Import a repository from the dashboard first. ImpactTrace needs Bob's repo context to analyze your changes.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0f62fe] px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-[#0f62fe]/90"
          >
            <ArrowLeft size={16} weight="bold" />
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/5 px-8 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/70"
          >
            <ArrowLeft size={14} weight="bold" />
            Back
          </button>
          <span className="text-sm text-white/20">·</span>
          <span className="font-mono text-sm text-white/40">
            {currentRepoName}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <App />
      </div>
    </div>
  );
}
