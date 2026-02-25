import { useState } from "react";
import { useAITools } from "@/hooks/useAITools";
import { useNotes } from "@/contexts/NotesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { BarChart3, Loader2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

export function ProductivityAnalytics() {
  const { runTool, loading, result, setResult } = useAITools();
  const { notes } = useNotes();
  const { t } = useLanguage();
  const [showPanel, setShowPanel] = useState(false);

  const handleAnalyze = async () => {
    const activeNotes = notes.filter((n) => !n.isTrashed);
    const notesData = {
      totalNotes: activeNotes.length,
      pinned: activeNotes.filter((n) => n.isPinned).length,
      archived: activeNotes.filter((n) => n.isArchived).length,
      categories: activeNotes.reduce(
        (acc, n) => {
          acc[n.category] = (acc[n.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      recentNotes: activeNotes
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 10)
        .map((n) => ({
          title: n.title,
          category: n.category,
          tags: n.tags,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        })),
      allTags: [...new Set(activeNotes.flatMap((n) => n.tags))],
    };
    setShowPanel(true);
    await runTool("productivity_analytics", "", { notesData });
  };

  if (!showPanel) {
    return (
      <Button variant="outline" size="sm" className="text-xs border-border/50" onClick={handleAnalyze}>
        <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
        {t("aiProductivity")}
      </Button>
    );
  }

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{t("aiProductivity")}</span>
        </div>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setShowPanel(false); setResult(null); }}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-4 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("aiAnalyzing")}
        </div>
      ) : result ? (
        <div className="text-xs prose prose-sm dark:prose-invert max-w-none leading-relaxed">
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      ) : null}
    </div>
  );
}
