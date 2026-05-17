import { motion } from "framer-motion";
import { GraniteResponse } from "@/types";

interface ImpactSummaryProps {
  response: GraniteResponse | null;
}

export default function ImpactSummary({ response }: ImpactSummaryProps) {
  if (!response?.summary) return null;

  const { whatChanged, whatIsAtRisk, whatToDo } = response.summary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="absolute bottom-0 left-0 right-0 border-t border-white/5 bg-bg-primary/95 backdrop-blur-sm p-6"
    >
      {/* Three-panel impact summary overlay */}
      <div className="grid grid-cols-3 gap-6">
        <SummarySection title="What Changed" content={whatChanged} />
        <SummarySection title="What Is At Risk" content={whatIsAtRisk} />
        <SummarySection title="What To Do" content={whatToDo} />
      </div>
    </motion.div>
  );
}

function SummarySection({ title, content }: { title: string; content: string | string[] }) {
  const text = Array.isArray(content) ? content.join(". ") : content;
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-zinc-300">{text}</p>
    </div>
  );
}
