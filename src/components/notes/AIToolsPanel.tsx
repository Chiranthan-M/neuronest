import { useState } from "react";
import { useAITools, AITool } from "@/hooks/useAITools";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  FileText,
  Paintbrush,
  ShieldCheck,
  Tag,
  Loader2,
  X,
  Copy,
  Check,
  Languages,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AIToolsPanelProps {
  content: string;
  onApply: (text: string) => void;
  onApplyTags?: (tags: string[]) => void;
}

const tones = ["Professional", "Casual", "Academic", "Friendly", "Formal", "Creative"];
const translateLangs = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "kn", name: "Kannada" },
  { code: "te", name: "Telugu" },
  { code: "ta", name: "Tamil" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ar", name: "Arabic" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
  { code: "ko", name: "Korean" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
];

export function AIToolsPanel({ content, onApply, onApplyTags }: AIToolsPanelProps) {
  const { runTool, loading, result, setResult } = useAITools();
  const { t } = useLanguage();
  const [activeTool, setActiveTool] = useState<AITool | null>(null);
  const [selectedTone, setSelectedTone] = useState("Professional");
  const [targetLang, setTargetLang] = useState("en");
  const [copied, setCopied] = useState(false);

  const tools = [
    { id: "summarize" as AITool, icon: FileText, label: t("aiSummarize") },
    { id: "improve_writing" as AITool, icon: Sparkles, label: t("aiImprove") },
    { id: "change_tone" as AITool, icon: Paintbrush, label: t("aiTone") },
    { id: "plagiarism_check" as AITool, icon: ShieldCheck, label: t("aiPlagiarism") },
    { id: "smart_tags" as AITool, icon: Tag, label: t("aiSmartTags") },
    { id: "translate" as AITool, icon: Languages, label: t("aiTranslate") },
  ];

  const handleRun = async (tool: AITool) => {
    if (!content.trim()) return;
    setActiveTool(tool);
    const opts: any = {};
    if (tool === "change_tone") opts.tone = selectedTone;
    if (tool === "translate") opts.targetLang = targetLang;
    const res = await runTool(tool, content, opts);
    if (tool === "smart_tags" && res) {
      try {
        const parsed = JSON.parse(res);
        if (Array.isArray(parsed) && onApplyTags) {
          onApplyTags(parsed);
          setResult(null);
          setActiveTool(null);
        }
      } catch {
        // result displayed as text
      }
    }
  };

  const handleApply = () => {
    if (result && activeTool !== "plagiarism_check" && activeTool !== "smart_tags") {
      onApply(result);
      setResult(null);
      setActiveTool(null);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">{t("aiTools")}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            size="sm"
            variant={activeTool === tool.id ? "default" : "secondary"}
            className={`text-xs h-8 ${activeTool === tool.id ? "gradient-primary text-primary-foreground" : ""}`}
            disabled={loading || !content.trim()}
            onClick={() => handleRun(tool.id)}
          >
            {loading && activeTool === tool.id ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <tool.icon className="w-3 h-3 mr-1" />
            )}
            {tool.label}
          </Button>
        ))}
      </div>

      {activeTool === "change_tone" && !result && (
        <Select value={selectedTone} onValueChange={setSelectedTone}>
          <SelectTrigger className="w-full h-8 text-xs bg-secondary/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tones.map((t) => (
              <SelectItem key={t} value={t} className="text-xs">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {activeTool === "translate" && !result && (
        <Select value={targetLang} onValueChange={setTargetLang}>
          <SelectTrigger className="w-full h-8 text-xs bg-secondary/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {translateLangs.map((l) => (
              <SelectItem key={l.code} value={l.code} className="text-xs">
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {result && (
        <div className="bg-secondary/40 rounded-lg p-3 border border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-primary">{t("aiResult")}</span>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCopy}>
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setResult(null); setActiveTool(null); }}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="text-xs leading-relaxed prose prose-sm dark:prose-invert max-w-none max-h-[200px] overflow-auto">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
          {activeTool !== "plagiarism_check" && activeTool !== "smart_tags" && (
            <Button size="sm" className="text-xs h-7 gradient-primary text-primary-foreground" onClick={handleApply}>
              {t("aiApply")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
