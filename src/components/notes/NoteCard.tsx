import { Note } from "@/types/note";
import { Pin, Archive, Trash2, MoreHorizontal, Lock, LockOpen, Paperclip } from "lucide-react";
import { useNotes } from "@/contexts/NotesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  showRestore?: boolean;
  compact?: boolean;
}

const categoryColors: Record<string, string> = {
  General: "bg-primary/15",
  Programming: "bg-emerald-500/15",
  "Computer Science": "bg-violet-500/15",
  Projects: "bg-orange-500/15",
  Personal: "bg-pink-500/15",
  Work: "bg-slate-500/15",
};

export function NoteCard({ note, onClick, showRestore, compact }: NoteCardProps) {
  const { togglePin, toggleArchive, trashNote, restoreNote, permanentlyDelete, togglePrivate } = useNotes();
  const { t } = useLanguage();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (compact) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-xl bg-card border border-border/50 hover:shadow-elevated hover:border-primary/15 transition-all duration-250 cursor-pointer group active:scale-[0.99]"
        onClick={onClick}
      >
        <div className={cn("w-1 h-8 rounded-full flex-shrink-0", categoryColors[note.category] || "bg-muted")} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {note.isPinned && <Pin className="w-3 h-3 text-primary flex-shrink-0" />}
            <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{note.title}</h3>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{note.content || "No content yet..."}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {note.tags.slice(0, 1).map((tag) => (
            <span key={tag} className="tag-pill text-[10px] hidden sm:inline-flex">{tag}</span>
          ))}
          <span className="text-[10px] text-muted-foreground font-medium">{formatDate(note.updatedAt)}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn("note-card group", note.isPinned && "ring-1 ring-primary/15 bg-primary/[0.02]")}
      onClick={onClick}
    >
      {/* Category strip */}
      <div className={cn("absolute top-0 left-5 right-5 h-0.5 rounded-b-full opacity-50", categoryColors[note.category] || "bg-muted")} />

      {/* Menu */}
      <div className="absolute top-3 right-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg hover:bg-secondary/80 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass rounded-xl min-w-[150px]">
            {showRestore ? (
              <>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); restoreNote(note.id); }} className="rounded-lg text-sm">
                  {t("restore")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); permanentlyDelete(note.id); }}
                  className="text-destructive rounded-lg text-sm"
                >
                  {t("deleteForever")}
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePin(note.id); }} className="rounded-lg text-sm">
                  <Pin className="w-3.5 h-3.5 mr-2" />
                  {note.isPinned ? t("unpin") : t("pin")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleArchive(note.id); }} className="rounded-lg text-sm">
                  <Archive className="w-3.5 h-3.5 mr-2" />
                  {note.isArchived ? t("unarchive") : t("archive")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePrivate(note.id); }} className="rounded-lg text-sm">
                  {note.isPrivate ? <LockOpen className="w-3.5 h-3.5 mr-2" /> : <Lock className="w-3.5 h-3.5 mr-2" />}
                  {note.isPrivate ? t("moveToPublic") : t("moveToPrivate")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); trashNote(note.id); }}
                  className="text-destructive rounded-lg text-sm"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  {t("trash")}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Indicators */}
      <div className="flex items-center gap-1.5 mb-2.5">
        {note.isPinned && <Pin className="w-3 h-3 text-primary" />}
        {note.isPrivate && <Lock className="w-3 h-3 text-muted-foreground" />}
        {note.attachments && note.attachments.length > 0 && <Paperclip className="w-3 h-3 text-muted-foreground" />}
      </div>

      {/* Content */}
      <div>
        <h3 className="font-semibold text-sm mb-1.5 line-clamp-1 pr-8 group-hover:text-primary transition-colors duration-200">{note.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
          {note.content || "No content yet..."}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-border/30">
        <div className="flex flex-wrap gap-1">
          {note.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="tag-pill text-[10px]">
              {tag}
            </span>
          ))}
          {note.tags.length > 2 && (
            <span className="text-[10px] text-muted-foreground/70 font-medium">+{note.tags.length - 2}</span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground font-medium">{formatDate(note.updatedAt)}</span>
      </div>
    </motion.div>
  );
}
