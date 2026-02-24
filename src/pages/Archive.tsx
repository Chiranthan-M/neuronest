import { useNotes } from "@/contexts/NotesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NoteCard } from "@/components/notes/NoteCard";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ArchiveIcon className="w-6 h-6 text-muted-foreground" />
          {t("archive")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{archivedNotes.length} {t("archivedNotes")}</p>
      </div>

      <AnimatePresence mode="popLayout">
        {archivedNotes.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedNotes.map((note) => (
              <NoteCard key={note.id} note={note} onClick={() => { setEditingNote(note); setEditorOpen(true); }} />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">{t("noArchivedNotes")}</p>
          </div>
        )}
      </AnimatePresence>

      <NoteEditor note={editingNote} open={editorOpen} onClose={() => { setEditorOpen(false); setEditingNote(null); }} />
    </div>
  );
}
