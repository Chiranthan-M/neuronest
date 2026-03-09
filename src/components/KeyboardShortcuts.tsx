import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsProps {
  onNewNote?: () => void;
}

const shortcuts = [
  { keys: "⌘ / Ctrl + K", desc: "Open command palette" },
  { keys: "⌘ / Ctrl + N", desc: "Create new note" },
  { keys: "⌘ / Ctrl + S", desc: "Save current note" },
  { keys: "Escape", desc: "Close current modal" },
  { keys: "?", desc: "Show this cheatsheet" },
];

export function KeyboardShortcuts({ onNewNote }: KeyboardShortcutsProps) {
  const [showSheet, setShowSheet] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // ⌘+N / Ctrl+N → New note
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onNewNote?.() || navigate("/notes?new=true");
      }

      // ? → cheatsheet (only when not in input)
      if (e.key === "?" && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowSheet((s) => !s);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onNewNote, navigate]);

  return (
    <Dialog open={showSheet} onOpenChange={setShowSheet}>
      <DialogContent className="glass rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Keyboard className="w-4 h-4 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          {shortcuts.map((s) => (
            <div
              key={s.keys}
              className="flex items-center justify-between py-2 px-1 border-b border-border/30 last:border-0"
            >
              <span className="text-sm text-muted-foreground">{s.desc}</span>
              <kbd className="text-[11px] font-mono px-2 py-1 rounded-lg bg-secondary text-secondary-foreground border border-border/50">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
