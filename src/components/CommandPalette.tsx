import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useNotes } from "@/contexts/NotesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  FileText,
  Plus,
  Search,
  Settings,
  BookOpen,
  Archive,
  Trash2,
  Lock,
  Home,
  Sparkles,
  Keyboard,
  Zap,
} from "lucide-react";
import { Note } from "@/types/note";

interface CommandPaletteProps {
  onNewNote?: () => void;
  onOpenNote?: (note: Note) => void;
}

export function CommandPalette({ onNewNote, onOpenNote }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const { notes } = useNotes();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const activeNotes = useMemo(
    () => notes.filter((n) => !n.isTrashed).slice(0, 10),
    [notes]
  );

  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggle]);

  const runAction = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={`${t("search") || "Search"} notes, actions…`} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runAction(() => { if (onNewNote) onNewNote(); else navigate("/notes?new=true"); })}>
            <Plus className="mr-2 h-4 w-4" />
            {t("newNote")}
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate("/"))}>
            <Home className="mr-2 h-4 w-4" />
            {t("dashboard")}
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate("/notes"))}>
            <FileText className="mr-2 h-4 w-4" />
            {t("allNotes")}
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate("/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            {t("settings") || "Settings"}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runAction(() => navigate("/notebooks"))}>
            <BookOpen className="mr-2 h-4 w-4" />
            {t("notebooks")}
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate("/archive"))}>
            <Archive className="mr-2 h-4 w-4" />
            {t("archive")}
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate("/trash"))}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t("trash")}
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate("/private"))}>
            <Lock className="mr-2 h-4 w-4" />
            {t("privateFolder")}
          </CommandItem>
        </CommandGroup>

        {activeNotes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Notes">
              {activeNotes.map((note) => (
                <CommandItem
                  key={note.id}
                  onSelect={() =>
                    runAction(() => onOpenNote?.(note))
                  }
                >
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{note.title || "Untitled"}</span>
                  {note.tags.length > 0 && (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      #{note.tags[0]}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
