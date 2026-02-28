import { useNotes } from "@/contexts/NotesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { FileText, Pin, Archive, Tag, TrendingUp, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
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
    { label: t("totalNotes"), value: activeNotes.length, icon: FileText, color: "text-primary" },
    { label: t("pinned"), value: pinnedCount, icon: Pin, color: "text-accent" },
    { label: t("archived"), value: archivedCount, icon: Archive, color: "text-muted-foreground" },
    { label: t("tagsUsed"), value: allTags.length, icon: Tag, color: "text-primary" },
  ];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">{t("dashboard")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("welcomeBack")}</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground/50" />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">{t("recentlyEdited")}</h2>
          </div>
          <Link to="/notes" className="text-xs text-primary hover:underline font-medium">
            {t("viewAll")}
          </Link>
        </div>
        <div className="space-y-2">
          {recentNotes.map((note) => (
            <Link
              key={note.id}
              to="/notes"
              className="flex items-center justify-between p-3 rounded-lg glass hover:shadow-glass transition-all group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {note.isPinned && <Pin className="w-3 h-3 text-primary flex-shrink-0" />}
                  <h3 className="text-sm font-medium truncate">{note.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{note.content.slice(0, 80)}</p>
              </div>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <div className="flex gap-1">
                  {note.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">{formatDate(note.updatedAt)}</span>
              </div>
            </Link>
          ))}
          {recentNotes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">{t("noNotesYet")}</p>
          )}
        </div>
      </motion.div>

      {allTags.length > 0 && (
        <motion.div variants={item}>
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            {t("yourTags")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <span key={tag} className="text-xs px-3 py-1.5 rounded-full glass font-medium text-muted-foreground hover:text-primary transition-colors cursor-default">
                #{tag}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
