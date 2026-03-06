import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useNotes } from "@/contexts/NotesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { ProductivityAnalytics } from "@/components/notes/ProductivityAnalytics";
import { Note, NoteSortBy } from "@/types/note";
import { Search, Plus, SlidersHorizontal, Sparkles, FileText, LayoutGrid, List } from "lucide-react";
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
  const { notes, loading } = useNotes();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<NoteSortBy>("newest");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
    let filtered = notes.filter((n) => !n.isTrashed && !n.isArchived && !n.isPrivate);
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

  const allTags = [...new Set(notes.filter((n) => !n.isTrashed && !n.isArchived && !n.isPrivate).flatMap((n) => n.tags))];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-28 rounded-xl bg-muted animate-pulse" />
            <div className="h-4 w-16 rounded-lg bg-muted animate-pulse mt-2" />
          </div>
        </div>
        <div className="h-10 rounded-xl bg-muted animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="skeleton-card p-5 space-y-3">
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-3 w-full rounded bg-muted animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
              <div className="flex gap-2 pt-2">
                <div className="h-5 w-12 rounded-full bg-muted animate-pulse" />
                <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="section-header-icon">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("allNotes")}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{activeNotes.length} {t("notes")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ProductivityAnalytics />
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => { setEditingNote(null); setEditorOpen(true); }}
              className="gradient-primary text-primary-foreground shadow-glass rounded-xl ripple-btn text-sm h-9"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {t("newNote")}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Search & Sort */}
      <div className="flex items-center gap-2">
        <motion.div
          className="relative flex-1"
          animate={{ scale: searchFocused ? 1.005 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${searchFocused ? 'text-primary' : 'text-muted-foreground'}`} />
          <Input
            placeholder={t("searchNotes")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="pl-9 bg-card border-border/50 rounded-xl h-10 premium-input text-sm"
          />
        </motion.div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="border-border/50 rounded-xl h-10 w-10 hover:bg-secondary/60"
          >
            {viewMode === "grid" ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="border-border/50 rounded-xl h-10 w-10 hover:bg-secondary/60">
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass rounded-xl">
              {(["newest", "oldest", "updated", "title"] as NoteSortBy[]).map((s) => (
                <DropdownMenuItem key={s} onClick={() => setSortBy(s)} className={`rounded-lg ${sortBy === s ? "text-primary font-medium" : ""}`}>
                  {sortLabels[s]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedTag(null)}
            className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 font-medium ${
              !selectedTag ? "gradient-primary text-primary-foreground shadow-sm" : "bg-card border border-border/50 text-secondary-foreground hover:border-primary/20"
            }`}
          >
            {t("all")}
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 font-medium ${
                selectedTag === tag ? "gradient-primary text-primary-foreground shadow-sm" : "bg-card border border-border/50 text-secondary-foreground hover:border-primary/20"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        {activeNotes.length > 0 ? (
          <motion.div
            layout
            className={viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
              : "flex flex-col gap-2"
            }
          >
            {activeNotes.map((note) => (
              <NoteCard key={note.id} note={note} onClick={() => { setEditingNote(note); setEditorOpen(true); }} compact={viewMode === "list"} />
            ))}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="empty-state">
            <div className="empty-state-icon">
              <Sparkles className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              {search ? t("noNotesMatch") : t("noNotesCreate")}
            </p>
            {!search && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { setEditingNote(null); setEditorOpen(true); }}
                className="mt-4 inline-flex items-center gap-2 text-xs text-primary font-medium px-4 py-2 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("createNote")}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile FAB */}
      <motion.div
        className="fab sm:hidden"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => { setEditingNote(null); setEditorOpen(true); }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
      >
        <Plus className="w-6 h-6" />
      </motion.div>

      <NoteEditor note={editingNote} open={editorOpen} onClose={() => { setEditorOpen(false); setEditingNote(null); }} />
    </motion.div>
  );
}
