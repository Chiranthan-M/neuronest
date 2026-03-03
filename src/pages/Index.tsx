import { useNotes } from "@/contexts/NotesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { FileText, Pin, Archive, Tag, TrendingUp, Clock, Loader2, Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

export default function Dashboard() {
  const { notes, loading } = useNotes();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
    .slice(0, 5);

  const stats = [
    { label: t("totalNotes"), value: activeNotes.length, icon: FileText, gradient: "from-primary/10 to-accent/10", iconColor: "text-primary" },
    { label: t("pinned"), value: pinnedCount, icon: Pin, gradient: "from-accent/10 to-primary/10", iconColor: "text-accent" },
    { label: t("archived"), value: archivedCount, icon: Archive, gradient: "from-muted to-secondary", iconColor: "text-muted-foreground" },
    { label: t("tagsUsed"), value: allTags.length, icon: Tag, gradient: "from-primary/10 to-accent/10", iconColor: "text-primary" },
  ];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">
      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h1>
          <p className="text-sm text-muted-foreground mt-1.5">{t("welcomeBack")}</p>
        </div>
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
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <motion.div
            key={s.label}
            whileHover={{ y: -3 }}
            className="stat-card group"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-4`}>
              <s.icon className={`w-5 h-5 ${s.iconColor}`} />
            </div>
            <p className="text-3xl font-bold tracking-tight">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Notes */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold">{t("recentlyEdited")}</h2>
          </div>
          <Link to="/notes" className="text-xs text-primary hover:underline font-medium px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors">
            {t("viewAll")}
          </Link>
        </div>
        <div className="space-y-2">
          {recentNotes.map((note, i) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <Link
                to="/notes"
                className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/60 hover:shadow-premium hover:border-primary/10 transition-all duration-250 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {note.isPinned && <Pin className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                    <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{note.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1">{note.content.slice(0, 100)}</p>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <div className="flex gap-1 hidden sm:flex">
                    {note.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/8 text-primary font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(note.updatedAt)}</span>
                </div>
              </Link>
            </motion.div>
          ))}
          {recentNotes.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Sparkles className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">{t("noNotesYet")}</p>
              <Link to="/notes?new=true" className="mt-4 text-xs text-primary font-medium hover:underline">
                {t("createNote")} →
              </Link>
            </div>
          )}
        </div>
      </motion.div>

      {/* Tags Cloud */}
      {allTags.length > 0 && (
        <motion.div variants={item}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Tag className="w-4 h-4 text-accent" />
            </div>
            <h2 className="font-semibold">{t("yourTags")}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <span key={tag} className="text-xs px-3.5 py-2 rounded-xl bg-card border border-border/60 font-medium text-muted-foreground hover:text-primary hover:border-primary/20 transition-all duration-200 cursor-default">
                #{tag}
              </span>
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
