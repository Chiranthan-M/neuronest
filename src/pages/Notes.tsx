import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useNotes } from "@/contexts/NotesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { ProductivityAnalytics } from "@/components/notes/ProductivityAnalytics";
import { Note, NoteSortBy } from "@/types/note";
import { Search, Plus, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Notes() {
  const { notes } = useNotes();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<NoteSortBy>("newest");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  useState(() => {
    if (searchParams.get("new") === "true") {
      setEditorOpen(true);
      setSearchParams({}, { replace: true });
    }
  });

  const sortLabels: Record<NoteSortBy, string> = {
    newest: t("newest"),
    oldest: t("oldest"),
    updated: t("updated"),
    title: t("title"),
  };

  const activeNotes = useMemo(() => {
    let filtered = notes.filter((n) => !n.isTrashed && !n.isArchived);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.includes(q))
      );
    }
    if (selectedTag) {
      filtered = filtered.filter((n) => n.tags.includes(selectedTag));
    }
    const pinned = filtered.filter((n) => n.isPinned);
    const unpinned = filtered.filter((n) => !n.isPinned);
    const sortFn = (a: Note, b: Note) => {
      switch (sortBy) {
        case "oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "updated": return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "title": return a.title.localeCompare(b.title);
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    };
    return [...pinned.sort(sortFn), ...unpinned.sort(sortFn)];
  }, [notes, search, sortBy, selectedTag]);

  const allTags = [...new Set(notes.filter((n) => !n.isTrashed && !n.isArchived).flatMap((n) => n.tags))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("allNotes")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{activeNotes.length} {t("notes")}</p>
        </div>
        <div className="flex items-center gap-2">
          <ProductivityAnalytics />
          <Button
            onClick={() => { setEditingNote(null); setEditorOpen(true); }}
            className="gradient-primary text-primary-foreground shadow-glass"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("newNote")}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("searchNotes")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/30 border-border/50"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="border-border/50">
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass">
            {(["newest", "oldest", "updated", "title"] as NoteSortBy[]).map((s) => (
              <DropdownMenuItem key={s} onClick={() => setSortBy(s)} className={sortBy === s ? "text-primary" : ""}>
                {sortLabels[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedTag(null)}
            className={`text-xs px-3 py-1.5 rounded-full transition-all ${
              !selectedTag ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {t("all")}
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                selectedTag === tag ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {activeNotes.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeNotes.map((note) => (
              <NoteCard key={note.id} note={note} onClick={() => { setEditingNote(note); setEditorOpen(true); }} />
            ))}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <p className="text-muted-foreground text-sm">
              {search ? t("noNotesMatch") : t("noNotesCreate")}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <NoteEditor note={editingNote} open={editorOpen} onClose={() => { setEditorOpen(false); setEditingNote(null); }} />
    </div>
  );
}
