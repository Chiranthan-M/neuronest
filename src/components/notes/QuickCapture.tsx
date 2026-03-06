import { useState } from "react";
import { useNotes } from "@/contexts/NotesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

export function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { addNote } = useNotes();
  const { t } = useLanguage();

  const handleSave = async () => {
    if (!title.trim()) return;
    await addNote({
      title,
      content,
      tags: [],
      category: "General",
      isPinned: false,
      isArchived: false,
      isPrivate: false,
    });
    setTitle("");
    setContent("");
    setOpen(false);
    toast({ title: t("noteCreated") || "Note created!" });
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 text-accent text-sm font-medium hover:bg-accent/15 transition-colors"
      >
        <Zap className="w-4 h-4" />
        {t("quickCapture") || "Quick Capture"}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md bg-card border border-border/50 rounded-2xl shadow-elevated p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-accent" />
                  </div>
                  <h3 className="font-semibold text-sm">{t("quickCapture") || "Quick Capture"}</h3>
                </div>
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <Input
                placeholder={t("noteTitle") || "Title..."}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-secondary/30 border-border/40 rounded-xl h-10 text-sm"
                autoFocus
              />
              <Textarea
                placeholder={t("startWriting") || "Write something..."}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-secondary/30 border-border/40 rounded-xl min-h-[80px] text-sm resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="rounded-xl text-xs">
                  {t("cancel")}
                </Button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button size="sm" onClick={handleSave} className="gradient-primary text-primary-foreground rounded-xl text-xs shadow-glass ripple-btn">
                    {t("createNote")}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
