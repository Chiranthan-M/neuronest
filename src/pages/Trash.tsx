import { useNotes } from "@/contexts/NotesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NoteCard } from "@/components/notes/NoteCard";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function TrashPage() {
  const { notes, permanentlyDelete } = useNotes();
  const { t } = useLanguage();
  const trashedNotes = notes.filter((n) => n.isTrashed);

  const emptyTrash = () => {
    trashedNotes.forEach((n) => permanentlyDelete(n.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-muted-foreground" />
            {t("trash")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{trashedNotes.length} {t("itemsInTrash")}</p>
        </div>
        {trashedNotes.length > 0 && (
          <Button variant="destructive" size="sm" onClick={emptyTrash}>
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
            {t("emptyTrash")}
          </Button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {trashedNotes.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trashedNotes.map((note) => (
              <NoteCard key={note.id} note={note} onClick={() => {}} showRestore />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">{t("trashEmpty")}</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
