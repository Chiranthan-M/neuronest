import { Note } from "@/types/note";
import { Pin, Archive, Trash2, MoreHorizontal } from "lucide-react";
import { useNotes } from "@/contexts/NotesContext";
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
}

export function NoteCard({ note, onClick, showRestore }: NoteCardProps) {
  const { togglePin, toggleArchive, trashNote, restoreNote, permanentlyDelete } = useNotes();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn("note-card group relative", note.isPinned && "ring-1 ring-primary/20")}
      onClick={onClick}
    >
      {/* Actions */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors"
          >
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass">
            {showRestore ? (
              <>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); restoreNote(note.id); }}>
                  Restore
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); permanentlyDelete(note.id); }}
                  className="text-destructive"
                >
                  Delete Forever
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePin(note.id); }}>
                  <Pin className="w-3.5 h-3.5 mr-2" />
                  {note.isPinned ? "Unpin" : "Pin"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleArchive(note.id); }}>
                  <Archive className="w-3.5 h-3.5 mr-2" />
                  {note.isArchived ? "Unarchive" : "Archive"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); trashNote(note.id); }}
                  className="text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Trash
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Pin indicator */}
      {note.isPinned && (
        <Pin className="w-3.5 h-3.5 text-primary absolute top-3 left-4" />
      )}

      {/* Content */}
      <div className={cn(note.isPinned && "mt-4")}>
        <h3 className="font-semibold text-sm mb-1.5 line-clamp-1 pr-8">{note.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
          {note.content}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {note.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
            >
              {tag}
            </span>
          ))}
          {note.tags.length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{note.tags.length - 2}</span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">{formatDate(note.updatedAt)}</span>
      </div>
    </motion.div>
  );
}
