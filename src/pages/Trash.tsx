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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("trash")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{trashedNotes.length} {t("itemsInTrash")}</p>
          </div>
        </div>
        {trashedNotes.length > 0 && (
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button variant="destructive" size="sm" onClick={emptyTrash} className="rounded-xl ripple-btn">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
              {t("emptyTrash")}
            </Button>
          </motion.div>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {trashedNotes.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {trashedNotes.map((note) => (
              <NoteCard key={note.id} note={note} onClick={() => {}} showRestore />
            ))}
          </motion.div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Trash2 className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">{t("trashEmpty")}</p>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
