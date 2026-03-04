import { useNotes } from "@/contexts/NotesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { FileText, Pin, Archive, Tag, Clock, Loader2, Plus, Sparkles, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="text-3xl font-bold tracking-tight"
    >
      {value}
    </motion.span>
  );
}

export default function Dashboard() {
  const { notes, loading } = useNotes();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-9 w-48 rounded-xl bg-muted animate-pulse" />
          <div className="h-4 w-32 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-card p-6 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
              <div className="h-8 w-12 rounded bg-muted animate-pulse" />
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-card p-4 flex gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeNotes = notes.filter((n) => !n.isTrashed);
  const pinnedCount = activeNotes.filter((n) => n.isPinned).length;
  const archivedCount = activeNotes.filter((n) => n.isArchived).length;
  const allTags = [...new Set(activeNotes.flatMap((n) => n.tags))];
  const recentNotes = [...activeNotes]
    .filter((n) => !n.isArchived)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  const stats = [
    { label: t("totalNotes"), value: activeNotes.length, icon: FileText, color: "text-primary", bg: "from-primary/12 to-accent/8" },
    { label: t("pinned"), value: pinnedCount, icon: Pin, color: "text-accent", bg: "from-accent/12 to-primary/8" },
    { label: t("archived"), value: archivedCount, icon: Archive, color: "text-muted-foreground", bg: "from-muted to-secondary" },
    { label: t("tagsUsed"), value: allTags.length, icon: Tag, color: "text-primary", bg: "from-primary/8 to-accent/12" },
  ];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  // Activity indicator: notes edited today
  const todayCount = activeNotes.filter(n => {
    const d = new Date(n.updatedAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">
      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">{getGreeting()} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1.5">{t("welcomeBack")}</p>
        </div>
        <div className="flex items-center gap-3">
          {todayCount > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-success/10 text-success text-xs font-medium">
              <Zap className="w-3.5 h-3.5" />
              {todayCount} edited today
            </div>
          )}
          <Link to="/notes?new=true">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-medium shadow-glass ripple-btn"
            >
              <Plus className="w-4 h-4" />
              {t("newNote")}
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="stat-card group"
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <AnimatedCounter value={s.value} />
            <p className="text-xs text-muted-foreground mt-1.5 font-medium tracking-wide uppercase">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Notes */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-5">
          <div className="section-header mb-0">
            <div className="section-header-icon">
              <Clock className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-base">{t("recentlyEdited")}</h2>
              <p className="text-xs text-muted-foreground">{recentNotes.length} recent notes</p>
            </div>
          </div>
          <Link to="/notes" className="text-xs text-primary font-medium px-3.5 py-2 rounded-xl hover:bg-primary/5 transition-colors">
            {t("viewAll")} →
          </Link>
        </div>
        <div className="space-y-2">
          {recentNotes.map((note, i) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <Link
                to="/notes"
                className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/50 hover:shadow-elevated hover:border-primary/15 transition-all duration-300 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {note.isPinned && <Pin className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                    <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors duration-200">{note.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1.5 leading-relaxed">{note.content.slice(0, 120)}</p>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <div className="hidden sm:flex gap-1.5">
                    {note.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="tag-pill">{tag}</span>
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap font-medium">{formatDate(note.updatedAt)}</span>
                </div>
              </Link>
            </motion.div>
          ))}
          {recentNotes.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="empty-state"
            >
              <div className="empty-state-icon">
                <Sparkles className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">{t("noNotesYet")}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Start by creating your first note</p>
              <Link to="/notes?new=true" className="mt-5 inline-flex items-center gap-2 text-xs text-primary font-medium px-4 py-2 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                {t("createNote")}
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Tags Cloud */}
      {allTags.length > 0 && (
        <motion.div variants={item}>
          <div className="section-header">
            <div className="section-header-icon">
              <Tag className="w-4.5 h-4.5 text-accent" />
            </div>
            <h2 className="font-semibold text-base">{t("yourTags")}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                className="text-xs px-4 py-2.5 rounded-xl bg-card border border-border/50 font-medium text-muted-foreground hover:text-primary hover:border-primary/20 hover:shadow-sm transition-all duration-250 cursor-default"
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
    </motion.div>
  );
}
