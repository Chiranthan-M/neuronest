import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";

interface Correction {
  original: string;
  corrected: string;
  reason: string;
}

interface AutoCorrectBannerProps {
  corrections: Correction[];
  onAccept: (correction: Correction) => void;
  onDismiss: (correction: Correction) => void;
}

export function AutoCorrectBanner({ corrections, onAccept, onDismiss }: AutoCorrectBannerProps) {
  if (corrections.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      <AnimatePresence>
        {corrections.slice(0, 3).map((c, i) => (
          <motion.div
            key={`${c.original}-${i}`}
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="inline-flex items-center gap-1.5 glass rounded-lg border border-amber-500/20 bg-amber-500/5 px-2 py-1"
          >
            <span className="text-[10px] text-muted-foreground line-through">{c.original}</span>
            <span className="text-[10px] text-foreground font-medium">→</span>
            <span className="text-[10px] text-primary font-medium">{c.corrected}</span>
            <button
              onClick={() => onAccept(c)}
              className="p-0.5 rounded hover:bg-primary/10 transition-colors"
              title={c.reason}
            >
              <Check className="w-3 h-3 text-primary" />
            </button>
            <button
              onClick={() => onDismiss(c)}
              className="p-0.5 rounded hover:bg-destructive/10 transition-colors"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
