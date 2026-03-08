import { useNotes } from "@/contexts/NotesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NoteCard } from "@/components/notes/NoteCard";
import { SwipeableNoteCard } from "@/components/notes/SwipeableNoteCard";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { Note } from "@/types/note";
import { useState } from "react";
import { Archive as ArchiveIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ArchivePage() {
  const { notes } = useNotes();
  const { t } = useLanguage();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const archivedNotes = notes.filter((n) => n.isArchived && !n.isTrashed);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="section-header-icon">
          <ArchiveIcon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("archive")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{archivedNotes.length} {t("archivedNotes")}</p>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {archivedNotes.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {archivedNotes.map((note) => (
              <NoteCard key={note.id} note={note} onClick={() => { setEditingNote(note); setEditorOpen(true); }} />
            ))}
          </motion.div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <ArchiveIcon className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">{t("noArchivedNotes")}</p>
          </div>
        )}
      </AnimatePresence>

      <NoteEditor note={editingNote} open={editorOpen} onClose={() => { setEditorOpen(false); setEditingNote(null); }} />
    </motion.div>
  );
}
