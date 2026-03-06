import { useState } from "react";
import { Note } from "@/types/note";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, FileText, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotebookCardProps {
  name: string;
  color: string;
  noteCount: number;
  recentNotes: Note[];
  onClick: () => void;
}

const notebookColors: Record<string, { bg: string; accent: string; text: string; spine: string }> = {
  General: { bg: "from-blue-500/90 to-blue-600/90", accent: "bg-blue-400/30", text: "text-white", spine: "bg-blue-700/60" },
  Programming: { bg: "from-emerald-500/90 to-teal-600/90", accent: "bg-emerald-400/30", text: "text-white", spine: "bg-emerald-700/60" },
  "Computer Science": { bg: "from-violet-500/90 to-purple-600/90", accent: "bg-violet-400/30", text: "text-white", spine: "bg-violet-700/60" },
  Projects: { bg: "from-orange-500/90 to-amber-600/90", accent: "bg-orange-400/30", text: "text-white", spine: "bg-orange-700/60" },
  Personal: { bg: "from-pink-500/90 to-rose-600/90", accent: "bg-pink-400/30", text: "text-white", spine: "bg-pink-700/60" },
  Work: { bg: "from-slate-500/90 to-slate-600/90", accent: "bg-slate-400/30", text: "text-white", spine: "bg-slate-700/60" },
};

const defaultColor = { bg: "from-primary/90 to-accent/90", accent: "bg-primary/30", text: "text-white", spine: "bg-primary/60" };

export function NotebookCard({ name, color, noteCount, recentNotes, onClick }: NotebookCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = notebookColors[name] || defaultColor;

  return (
    <motion.div
      className="relative cursor-pointer group"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Back pages effect */}
      <motion.div
        className="absolute -top-1 left-2 right-2 h-3 rounded-t-xl bg-card border border-border/30 opacity-60"
        animate={{ y: isHovered ? -3 : 0 }}
        transition={{ duration: 0.25 }}
      />
      <motion.div
        className="absolute -top-0.5 left-1 right-1 h-2 rounded-t-xl bg-card border border-border/20 opacity-40"
        animate={{ y: isHovered ? -1.5 : 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Main notebook cover */}
      <div className={cn(
        "relative rounded-2xl overflow-hidden shadow-elevated transition-shadow duration-300",
        "group-hover:shadow-glass-lg"
      )}>
        {/* Spine */}
        <div className={cn("absolute left-0 top-0 bottom-0 w-3 z-10", colors.spine)} />

        {/* Cover */}
        <div className={cn("bg-gradient-to-br p-6 pl-7 min-h-[180px] flex flex-col justify-between", colors.bg)}>
          {/* Header */}
          <div>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", colors.accent)}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h3 className={cn("text-lg font-bold tracking-tight", colors.text)}>{name}</h3>
            <p className={cn("text-sm mt-1 opacity-80", colors.text)}>
              {noteCount} {noteCount === 1 ? "note" : "notes"}
            </p>
          </div>

          {/* Recent notes preview */}
          <AnimatePresence>
            {isHovered && recentNotes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className="mt-4 space-y-1.5"
              >
                {recentNotes.slice(0, 3).map((note) => (
                  <div key={note.id} className="flex items-center gap-2 text-white/80 text-xs">
                    <FileText className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{note.title}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Open indicator */}
          <motion.div
            className="absolute bottom-4 right-4 flex items-center gap-1 text-white/60 text-xs font-medium"
            animate={{ x: isHovered ? 0 : -4, opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            Open <ChevronRight className="w-3.5 h-3.5" />
          </motion.div>
        </div>

        {/* Page lines decoration */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 space-y-1.5 opacity-20">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-px w-8 bg-white rounded-full" />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
