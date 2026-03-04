import { useState, useMemo } from "react";
import { useNotes } from "@/contexts/NotesContext";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PrivacyLockScreen } from "@/components/privacy/PrivacyLockScreen";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { Note } from "@/types/note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Plus, Search, LockOpen, Settings, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

export default function PrivatePage() {
  const { isUnlocked, lock, resetLock } = usePrivacy();
  const { notes, togglePin, trashNote } = useNotes();
  const { t } = useLanguage();
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [search, setSearch] = useState("");

  const privateNotes = useMemo(() => {
    return notes
      .filter((n) => n.isPrivate && !n.isTrashed)
      .filter((n) =>
        !search || n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes, search]);

  if (!isUnlocked) {
    return <PrivacyLockScreen onUnlocked={() => {}} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="section-header-icon">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("privateFolder")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{privateNotes.length} {t("notes")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="border-border/50 rounded-xl hover:bg-secondary/60">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass rounded-xl">
              <DropdownMenuItem onClick={lock} className="text-sm rounded-lg">
                <Lock className="w-4 h-4 mr-2" />
                {t("lockNow")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={resetLock} className="text-sm text-destructive rounded-lg">
                <LockOpen className="w-4 h-4 mr-2" />
                {t("resetLock")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => { setEditNote(null); setShowEditor(true); }}
              className="gradient-primary text-primary-foreground rounded-xl shadow-glass ripple-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("newNote")}
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t("searchNotes")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 border-border/50 bg-card rounded-xl h-11 premium-input"
        />
      </div>

      {privateNotes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <ShieldCheck className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground font-medium text-sm">{t("noPrivateNotes")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {privateNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => { setEditNote(note); setShowEditor(true); }}
            />
          ))}
        </div>
      )}

      <NoteEditor
        note={editNote}
        open={showEditor}
        onClose={() => setShowEditor(false)}
        isPrivate
      />
    </motion.div>
  );
}
