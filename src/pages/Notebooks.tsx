import { useState, useMemo } from "react";
import { useNotes } from "@/contexts/NotesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NotebookCard } from "@/components/notes/NotebookCard";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { Note } from "@/types/note";
import { BookOpen, ArrowLeft, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

export default function Notebooks() {
  const { notes } = useNotes();
  const { t } = useLanguage();
  const [openNotebook, setOpenNotebook] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const activeNotes = useMemo(() => notes.filter(n => !n.isTrashed && !n.isArchived && !n.isPrivate), [notes]);

  const notebooks = useMemo(() => {
    const grouped: Record<string, Note[]> = {};
    activeNotes.forEach(note => {
      const cat = note.category || "General";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(note);
    });
    // Sort each group by updatedAt desc
    Object.values(grouped).forEach(arr => arr.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    return grouped;
  }, [activeNotes]);

  const notebookNames = Object.keys(notebooks).sort();
  const currentNotes = openNotebook ? (notebooks[openNotebook] || []) : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <AnimatePresence mode="wait">
        {!openNotebook ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="section-header-icon">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("notebooks")}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {notebookNames.length} {t("notebooksCount")}
                </p>
              </div>
            </div>

            {/* Notebooks Grid */}
            {notebookNames.length > 0 ? (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2"
              >
                {notebookNames.map(name => (
                  <motion.div key={name} variants={item}>
                    <NotebookCard
                      name={name}
                      color={name}
                      noteCount={notebooks[name].length}
                      recentNotes={notebooks[name]}
                      onClick={() => setOpenNotebook(name)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Sparkles className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">{t("noNotebooks")}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{t("noNotebooksDesc")}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Back header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setOpenNotebook(null)}
                  className="p-2 rounded-xl hover:bg-secondary/60 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </motion.button>
                <div className="section-header-icon">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{openNotebook}</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {currentNotes.length} {t("notes")}
                  </p>
                </div>
              </div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={() => { setEditingNote(null); setEditorOpen(true); }}
                  className="gradient-primary text-primary-foreground shadow-glass rounded-xl ripple-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("newNote")}
                </Button>
              </motion.div>
            </div>

            {/* Notes in notebook */}
            <AnimatePresence mode="popLayout">
              {currentNotes.length > 0 ? (
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {currentNotes.map(note => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onClick={() => { setEditingNote(note); setEditorOpen(true); }}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="empty-state">
                  <div className="empty-state-icon">
                    <Sparkles className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">{t("noNotesCreate")}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <NoteEditor
        note={editingNote}
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingNote(null); }}
      />
    </motion.div>
  );
}
