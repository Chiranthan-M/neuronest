import { useNotes } from "@/contexts/NotesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { Note } from "@/types/note";
import { useState } from "react";
import { Archive as ArchiveIcon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ArchivePage() {
  const { notes } = useNotes();
  const { t } = useLanguage();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const archivedNotes = notes.filter((n) => n.isArchived && !n.isTrashed);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <ArchiveIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          {t("archive")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 ml-[52px]">{archivedNotes.length} {t("archivedNotes")}</p>
      </div>

      <AnimatePresence mode="popLayout">
        {archivedNotes.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedNotes.map((note) => (
              <NoteCard key={note.id} note={note} onClick={() => { setEditingNote(note); setEditorOpen(true); }} />
            ))}
          </motion.div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <ArchiveIcon className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">{t("noArchivedNotes")}</p>
          </div>
        )}
      </AnimatePresence>

      <NoteEditor note={editingNote} open={editorOpen} onClose={() => { setEditorOpen(false); setEditingNote(null); }} />
    </div>
  );
}
