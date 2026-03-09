import { useState } from "react";
import { FileText, Calendar, Briefcase, BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface NoteTemplate {
  id: string;
  title: string;
  content: string;
  icon: any;
  category: string;
  tags: string[];
}

const templates: NoteTemplate[] = [
  {
    id: "meeting",
    title: "Meeting Notes",
    content: `## Meeting Notes\n\n**Date:** ${new Date().toLocaleDateString()}\n**Attendees:**\n- \n\n### Agenda\n1. \n\n### Discussion\n\n\n### Action Items\n- [ ] \n- [ ] \n\n### Next Steps\n`,
    icon: Calendar,
    category: "Work",
    tags: ["meeting"],
  },
  {
    id: "journal",
    title: "Daily Journal",
    content: `## ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n\n### 🌅 Morning Thoughts\n\n\n### ✅ Today's Goals\n- [ ] \n- [ ] \n- [ ] \n\n### 📝 Notes\n\n\n### 🌙 Reflection\n`,
    icon: BookOpen,
    category: "Personal",
    tags: ["journal", "daily"],
  },
  {
    id: "project",
    title: "Project Brief",
    content: `## Project Brief\n\n### Overview\n\n\n### Objectives\n1. \n2. \n3. \n\n### Timeline\n| Phase | Duration | Status |\n|-------|----------|--------|\n| Planning | | |\n| Execution | | |\n| Review | | |\n\n### Resources\n\n\n### Success Criteria\n- \n`,
    icon: Briefcase,
    category: "Projects",
    tags: ["project"],
  },
];

interface NoteTemplatesProps {
  onSelect: (template: NoteTemplate) => void;
  onClose: () => void;
}

export function NoteTemplates({ onSelect, onClose }: NoteTemplatesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="glass rounded-2xl border border-border/40 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Start from Template
        </h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {templates.map((tmpl) => (
          <motion.button
            key={tmpl.id}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(tmpl)}
            className={cn(
              "flex flex-col items-start gap-2 p-3 rounded-xl border border-border/40 bg-card/50",
              "hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 text-left"
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <tmpl.icon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs font-medium">{tmpl.title}</span>
            <span className="text-[10px] text-muted-foreground">{tmpl.category}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export { templates };
