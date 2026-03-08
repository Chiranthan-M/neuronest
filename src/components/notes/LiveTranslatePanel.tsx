import { useState, useEffect, useRef, useCallback } from "react";
import { useAITools } from "@/hooks/useAITools";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Languages,
  ArrowRightLeft,
  Loader2,
  Copy,
  Check,
  Zap,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface LiveTranslatePanelProps {
  initialText?: string;
  onApply?: (text: string) => void;
  onClose?: () => void;
}

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", flag: "🇮🇳" },
  { code: "te", name: "Telugu", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", flag: "🇮🇳" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
];

export function LiveTranslatePanel({ initialText = "", onApply, onClose }: LiveTranslatePanelProps) {
  const { runTool, loading } = useAITools();
  const { t } = useLanguage();

  const [sourceText, setSourceText] = useState(initialText);
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const [style, setStyle] = useState("Standard");
  const [liveMode, setLiveMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [swapAnim, setSwapAnim] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTranslatedRef = useRef("");

  // Sync initialText changes
  useEffect(() => {
    if (initialText && initialText !== sourceText) {
      setSourceText(initialText);
    }
  }, [initialText]);

  const doTranslate = useCallback(async (text: string, lang: string, translateStyle: string) => {
    if (!text.trim()) {
      setTranslatedText("");
      return;
    }
    if (text.trim() === lastTranslatedRef.current) return;
    lastTranslatedRef.current = text.trim();

    const res = await runTool("translate", text, { targetLang: lang, tone: translateStyle });
    if (res) setTranslatedText(res);
  }, [runTool]);

  // Live mode: debounced auto-translate
  useEffect(() => {
    if (!liveMode) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doTranslate(sourceText, targetLang, style);
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [sourceText, targetLang, style, liveMode, doTranslate]);

  const handleManualTranslate = () => {
    lastTranslatedRef.current = "";
    doTranslate(sourceText, targetLang, style);
  };

  const handleSwapLanguages = () => {
    if (sourceLang === "auto") return;
    setSwapAnim(true);
    setTimeout(() => setSwapAnim(false), 400);
    const tempLang = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tempLang);
    const tempText = sourceText;
    setSourceText(translatedText);
    setTranslatedText(tempText);
    lastTranslatedRef.current = "";
  };

  const handleCopy = () => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const charCount = sourceText.length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">{t("aiTranslate")}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Live mode toggle */}
          <div className="flex items-center gap-1.5">
            <Zap className={cn("w-3 h-3 transition-colors", liveMode ? "text-primary" : "text-muted-foreground")} />
            <span className="text-[10px] font-medium text-muted-foreground">{t("liveMode")}</span>
            <Switch
              checked={liveMode}
              onCheckedChange={setLiveMode}
              className="scale-75 origin-left"
            />
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded-md hover:bg-secondary transition-colors">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Language selector row */}
      <div className="flex items-center gap-2">
        <Select value={sourceLang} onValueChange={setSourceLang}>
          <SelectTrigger className="flex-1 h-8 text-xs glass border-border/40 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto" className="text-xs">🔍 Auto-detect</SelectItem>
            {languages.map((l) => (
              <SelectItem key={l.code} value={l.code} className="text-xs">
                {l.flag} {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <motion.button
          onClick={handleSwapLanguages}
          disabled={sourceLang === "auto"}
          animate={{ rotate: swapAnim ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "p-1.5 rounded-lg transition-colors shrink-0",
            sourceLang === "auto"
              ? "text-muted-foreground/40 cursor-not-allowed"
              : "text-primary hover:bg-primary/10"
          )}
        >
          <ArrowRightLeft className="w-4 h-4" />
        </motion.button>

        <Select value={targetLang} onValueChange={(v) => { setTargetLang(v); lastTranslatedRef.current = ""; }}>
          <SelectTrigger className="flex-1 h-8 text-xs glass border-border/40 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languages.map((l) => (
              <SelectItem key={l.code} value={l.code} className="text-xs">
                {l.flag} {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Input/Output panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Source */}
        <div className="relative">
          <Textarea
            placeholder={t("translateInputPlaceholder")}
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            className="min-h-[100px] text-sm bg-secondary/20 border-border/40 rounded-xl resize-none focus-visible:ring-primary/20"
          />
          <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/60">
            {charCount}
          </span>
        </div>

        {/* Translation output */}
        <div className="relative">
          <div className={cn(
            "min-h-[100px] rounded-xl border border-border/40 bg-primary/5 p-3 text-sm leading-relaxed",
            !translatedText && "flex items-center justify-center"
          )}>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">{t("translating")}</span>
                </motion.div>
              ) : translatedText ? (
                <motion.p
                  key="result"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-foreground whitespace-pre-wrap"
                >
                  {translatedText}
                </motion.p>
              ) : (
                <motion.span
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  className="text-xs text-muted-foreground"
                >
                  {t("translateOutputPlaceholder")}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Copy button */}
          {translatedText && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-secondary transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
            </button>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {liveMode && (
            <span className="flex items-center gap-1 text-[10px] text-primary font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {t("liveActive")}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {!liveMode && (
            <Button
              size="sm"
              onClick={handleManualTranslate}
              disabled={loading || !sourceText.trim()}
              className="text-xs h-8 gradient-primary text-primary-foreground rounded-xl"
            >
              {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Languages className="w-3 h-3 mr-1" />}
              {t("translateNow")}
            </Button>
          )}
          {translatedText && onApply && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onApply(translatedText)}
              className="text-xs h-8 rounded-xl"
            >
              {t("aiApply")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
