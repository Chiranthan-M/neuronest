import { useNotes } from "@/contexts/NotesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { FileText, Pin, Archive, Tag, Clock, Plus, Sparkles, Zap, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { NoteCard } from "@/components/notes/NoteCard";
import { SwipeableNoteCard } from "@/components/notes/SwipeableNoteCard";
import { QuickCapture } from "@/components/notes/QuickCapture";
import { useState } from "react";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { Note } from "@/types/note";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function AnimatedCounter({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="text-2xl font-bold tracking-tight"
    >
      {value}
    </motion.span>
  );
}

export default function Dashboard() {
  const { notes, loading } = useNotes();
  const { t } = useLanguage();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-xl bg-muted animate-pulse" />
          <div className="h-4 w-32 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-card p-5 space-y-3">
              <div className="h-9 w-9 rounded-xl bg-muted animate-pulse" />
              <div className="h-7 w-10 rounded bg-muted animate-pulse" />
              <div className="h-3 w-16 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-card p-5 space-y-3">
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-3 w-full rounded bg-muted animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeNotes = notes.filter((n) => !n.isTrashed);
  const pinnedNotes = activeNotes.filter((n) => n.isPinned && !n.isArchived);
  const archivedCount = activeNotes.filter((n) => n.isArchived).length;
  const allTags = [...new Set(activeNotes.flatMap((n) => n.tags))];
  const recentNotes = [...activeNotes]
    .filter((n) => !n.isArchived)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  const stats = [
    { label: t("totalNotes"), value: activeNotes.length, icon: FileText, bg: "from-primary/12 to-accent/8", color: "text-primary" },
    { label: t("pinned"), value: pinnedNotes.length, icon: Pin, bg: "from-accent/12 to-primary/8", color: "text-accent" },
    { label: t("archived"), value: archivedCount, icon: Archive, bg: "from-muted to-secondary", color: "text-muted-foreground" },
    { label: t("tagsUsed"), value: allTags.length, icon: Tag, bg: "from-primary/8 to-accent/12", color: "text-primary" },
  ];

  const todayCount = activeNotes.filter(n => new Date(n.updatedAt).toDateString() === new Date().toDateString()).length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">{getGreeting()} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("welcomeBack")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {todayCount > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-success/10 text-success text-xs font-medium">
              <Zap className="w-3.5 h-3.5" />
              {todayCount} edited today
            </div>
          )}
          <QuickCapture />
          <Link to="/notes?new=true">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-medium shadow-glass ripple-btn"
            >
              <Plus className="w-4 h-4" />
              {t("newNote")}
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <motion.div
            key={s.label}
            whileHover={{ y: -3 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="stat-card group"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
              <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
            </div>
            <AnimatedCounter value={s.value} />
            <p className="text-[10px] text-muted-foreground mt-1 font-medium tracking-wider uppercase">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Pinned / Favorites */}
      {pinnedNotes.length > 0 && (
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-4">
            <div className="section-header mb-0">
              <div className="section-header-icon">
                <Star className="w-4 h-4 text-accent" />
              </div>
              <h2 className="font-semibold text-sm">{t("pinned")} / Favorites</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {pinnedNotes.slice(0, 4).map((note) => (
              <SwipeableNoteCard
                key={note.id}
                note={note}
                onClick={() => { setEditingNote(note); setEditorOpen(true); }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Notes */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <div className="section-header mb-0">
            <div className="section-header-icon">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold text-sm">{t("recentlyEdited")}</h2>
          </div>
          <Link to="/notes" className="text-xs text-primary font-medium px-3 py-1.5 rounded-xl hover:bg-primary/5 transition-colors">
            {t("viewAll")} →
          </Link>
        </div>
        {recentNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {recentNotes.map((note) => (
              <SwipeableNoteCard
                key={note.id}
                note={note}
                onClick={() => { setEditingNote(note); setEditorOpen(true); }}
              />
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="empty-state py-12">
            <div className="empty-state-icon">
              <Sparkles className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-base font-semibold text-foreground">{t("noNotesYet")}</p>
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs text-center">Capture your first idea — it only takes a second</p>
            <div className="flex gap-2 mt-5">
              <Link to="/notes?new=true" className="inline-flex items-center gap-2 text-xs text-primary-foreground font-medium px-4 py-2.5 rounded-xl gradient-primary shadow-glass ripple-btn transition-all hover:opacity-90">
                <Plus className="w-3.5 h-3.5" />
                {t("createNote")}
              </Link>
              <button
                onClick={() => { setEditingNote(null); setEditorOpen(true); }}
                className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                Quick Capture
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Tags Cloud */}
      {allTags.length > 0 && (
        <motion.div variants={item}>
          <div className="section-header">
            <div className="section-header-icon">
              <Tag className="w-4 h-4 text-accent" />
            </div>
            <h2 className="font-semibold text-sm">{t("yourTags")}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                className="tag-pill cursor-default"
              >
                #{tag}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Mobile FAB */}
      <Link to="/notes?new=true" className="sm:hidden">
        <motion.div
          className="fab"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
        >
          <Plus className="w-6 h-6" />
        </motion.div>
      </Link>

      <NoteEditor note={editingNote} open={editorOpen} onClose={() => { setEditorOpen(false); setEditingNote(null); }} />
    </motion.div>
  );
}
