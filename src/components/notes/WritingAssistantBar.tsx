import { useLanguage } from "@/contexts/LanguageContext";
import { useAITools } from "@/hooks/useAITools";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  RefreshCw,
  Shrink,
  Expand,
  Briefcase,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";

interface WritingAssistantBarProps {
  content: string;
  onApply: (text: string) => void;
  visible: boolean;
  onToggle: () => void;
}

const actions = [
  { id: "improve_writing" as const, icon: Wand2, label: "Improve" },
  { id: "rewrite" as const, icon: RefreshCw, label: "Rewrite" },
  { id: "simplify" as const, icon: Shrink, label: "Simplify" },
  { id: "expand" as const, icon: Expand, label: "Expand" },
  { id: "change_tone" as const, icon: Briefcase, label: "Formal", tone: "Professional" },
];

export function WritingAssistantBar({ content, onApply, visible, onToggle }: WritingAssistantBarProps) {
  const { runTool, loading } = useAITools();
  const { t } = useLanguage();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleAction = async (actionId: string, tone?: string) => {
    if (!content.trim() || loading) return;
    setActiveAction(actionId);
    setResult(null);

    const res = await runTool(actionId as any, content, tone ? { tone } : undefined);
    if (res) {
      setResult(res);
    }
    setActiveAction(null);
  };

  const handleApplyResult = () => {
    if (result) {
      onApply(result);
      setResult(null);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: 8, height: 0 }}
          className="overflow-hidden"
        >
          <div className="glass rounded-xl border border-border/40 p-2 space-y-2">
            {/* Action buttons row */}
            <div className="flex items-center gap-1 flex-wrap">
              <Sparkles className="w-3.5 h-3.5 text-primary mr-1" />
              {actions.map((action) => (
                <Button
                  key={action.id}
                  size="sm"
                  variant="ghost"
                  disabled={loading || !content.trim()}
                  className={cn(
                    "h-7 text-[11px] px-2 rounded-lg gap-1",
                    activeAction === action.id && "bg-primary/10 text-primary"
                  )}
                  onClick={() => handleAction(action.id, action.tone)}
                >
                  {loading && activeAction === action.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <action.icon className="w-3 h-3" />
                  )}
                  {action.label}
                </Button>
              ))}
              <button
                onClick={onToggle}
                className="ml-auto p-1 rounded-md hover:bg-secondary transition-colors"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>

            {/* Result preview */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-primary/5 rounded-lg p-2.5 border border-primary/10 space-y-2">
                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-[150px] overflow-auto">
                      {result}
                    </p>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        onClick={handleApplyResult}
                        className="h-6 text-[10px] px-2 gradient-primary text-primary-foreground rounded-lg"
                      >
                        {t("aiApply")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setResult(null)}
                        className="h-6 text-[10px] px-2 rounded-lg"
                      >
                        {t("cancel")}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
