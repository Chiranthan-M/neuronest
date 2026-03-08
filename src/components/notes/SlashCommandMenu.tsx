import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  RefreshCw,
  Expand,
  Shrink,
  Wand2,
  Languages,
  Wrench,
  X,
} from "lucide-react";

interface SlashCommandMenuProps {
  show: boolean;
  position: { top: number; left: number };
  filter: string;
  onSelect: (command: string) => void;
  onClose: () => void;
}

const commands = [
  { id: "summarize", label: "Summarize", icon: FileText, desc: "Create a brief summary" },
  { id: "rewrite", label: "Rewrite", icon: RefreshCw, desc: "Rewrite for clarity" },
  { id: "expand", label: "Expand", icon: Expand, desc: "Add more detail" },
  { id: "simplify", label: "Simplify", icon: Shrink, desc: "Make it simpler" },
  { id: "improve_writing", label: "Improve", icon: Wand2, desc: "Polish the writing" },
  { id: "translate", label: "Translate", icon: Languages, desc: "Translate to another language" },
  { id: "autocorrect", label: "Fix Grammar", icon: Wrench, desc: "Fix spelling & grammar" },
];

export function SlashCommandMenu({ show, position, filter, onSelect, onClose }: SlashCommandMenuProps) {
  const { t } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = commands.filter(
    (cmd) =>
      cmd.id.includes(filter.toLowerCase()) ||
      cmd.label.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    if (!show) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        onSelect(filtered[selectedIndex].id);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [show, filtered, selectedIndex, onSelect, onClose]);

  if (!show || filtered.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="absolute z-50 w-64 glass rounded-xl border border-border/50 shadow-lg overflow-hidden"
        style={{ top: position.top, left: position.left }}
      >
        <div className="px-3 py-2 border-b border-border/30">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            AI Commands
          </span>
        </div>
        <div className="py-1 max-h-[240px] overflow-auto">
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              onClick={() => onSelect(cmd.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                i === selectedIndex
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-secondary/50 text-foreground"
              )}
            >
              <cmd.icon className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium">{cmd.label}</div>
                <div className="text-[10px] text-muted-foreground truncate">{cmd.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
