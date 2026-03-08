import { useState, useEffect, useRef, useCallback } from "react";
import { Note } from "@/types/note";
import { useNotes } from "@/contexts/NotesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useVoiceToText } from "@/hooks/useVoiceToText";
import { useSmartEditor } from "@/hooks/useSmartEditor";
import { useAITools } from "@/hooks/useAITools";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Mic, MicOff, Paperclip, Loader2, PenTool, ScanText, Maximize2, Minimize2, Sparkles } from "lucide-react";
import { AIToolsPanel } from "./AIToolsPanel";
import { DrawingCanvas } from "./DrawingCanvas";
import { OCRPanel, processCanvasOCR } from "./OCRPanel";
import { SlashCommandMenu } from "./SlashCommandMenu";
import { WritingAssistantBar } from "./WritingAssistantBar";
import { AutoCorrectBanner } from "./AutoCorrectBanner";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NoteEditorProps {
  note?: Note | null;
  open: boolean;
  onClose: () => void;
  isPrivate?: boolean;
}

const categoryKeys = ["general", "programming", "computerScience", "projects", "personal", "work"] as const;
const categoryValues = ["General", "Programming", "Computer Science", "Projects", "Personal", "Work"];

export function NoteEditor({ note, open, onClose, isPrivate = false }: NoteEditorProps) {
  const { addNote, updateNote, uploadAttachment } = useNotes();
  const { t } = useLanguage();
  const { isListening, startListening, stopListening, isSupported } = useVoiceToText();
  const { runTool, loading: aiActionLoading } = useAITools();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [category, setCategory] = useState("General");
  const [showAI, setShowAI] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [smartEditorEnabled, setSmartEditorEnabled] = useState(true);

  // Slash command state
  const [slashCmd, setSlashCmd] = useState({ show: false, filter: "", pos: { top: 0, left: 0 } });

  // Smart editor hook
  const {
    ghostText,
    corrections,
    acceptCompletion,
    applyCorrection,
    dismissCorrection,
    setGhostText,
  } = useSmartEditor({ content, enabled: smartEditorEnabled && open });

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags);
      setCategory(note.category);
      setAttachments(note.attachments || []);
    } else {
      setTitle("");
      setContent("");
      setTags([]);
      setTagInput("");
      setCategory("General");
      setAttachments([]);
    }
    setShowAI(false);
    setShowDrawing(false);
    setShowOCR(false);
    setFocusMode(false);
    setShowAssistant(false);
    setSlashCmd({ show: false, filter: "", pos: { top: 0, left: 0 } });
  }, [note, open]);

  const handleSave = async () => {
    if (!title.trim()) return;
    if (note) {
      await updateNote(note.id, { title, content, tags, category });
    } else {
      await addNote({ title, content, tags, category, isPinned: false, isArchived: false, isPrivate });
    }
    onClose();
  };

  const addTag = () => {
    const tVal = tagInput.trim().toLowerCase();
    if (tVal && !tags.includes(tVal)) {
      setTags([...tags, tVal]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((tVal) => tVal !== tag));
  };

  const handleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((text) => {
        setContent((prev) => (prev ? prev + " " : "") + text);
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !note) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const url = await uploadAttachment(note.id, file);
      if (url) setAttachments((prev) => [...prev, url]);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const ToolbarButton = ({ icon: Icon, label, onClick, active, variant }: {
    icon: any; label: string; onClick: () => void; active?: boolean; variant?: "destructive";
  }) => (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant={active ? "default" : variant === "destructive" ? "destructive" : "secondary"}
          className={cn("h-8 w-8 p-0 rounded-lg", active && "gradient-primary text-primary-foreground")}
          onClick={onClick}
        >
          <Icon className="w-3.5 h-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={cn(
        "glass max-w-[calc(100vw-2rem)] sm:max-w-[700px] max-h-[90vh] sm:max-h-[85vh] overflow-auto rounded-2xl border-border/40 p-4 sm:p-6",
        focusMode && "sm:max-w-[900px]"
      )}>
        <DialogHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {note ? t("editNote") : t("createNote")}
            </DialogTitle>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button onClick={() => setFocusMode(!focusMode)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                  {focusMode ? <Minimize2 className="w-4 h-4 text-muted-foreground" /> : <Maximize2 className="w-4 h-4 text-muted-foreground" />}
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Focus Mode</TooltipContent>
            </Tooltip>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          <Input
            placeholder={t("noteTitle")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold border-0 bg-transparent px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/40"
          />

          <div className="relative">
            <Textarea
              placeholder={t("startWriting")}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={cn(
                "resize-none border-border/40 bg-secondary/20 rounded-xl focus-visible:ring-primary/20 leading-relaxed pr-12",
                focusMode ? "min-h-[400px]" : "min-h-[200px]"
              )}
              style={{
                backgroundImage: focusMode ? 'repeating-linear-gradient(transparent, transparent 31px, hsl(var(--border) / 0.3) 31px, hsl(var(--border) / 0.3) 32px)' : 'none',
                backgroundPositionY: '8px',
                lineHeight: focusMode ? '32px' : undefined,
              }}
            />
            {/* Floating toolbar */}
            <div className="absolute bottom-3 right-3 flex gap-1">
              {note && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                  />
                  <ToolbarButton
                    icon={uploading ? Loader2 : Paperclip}
                    label={t("attachFile")}
                    onClick={() => fileInputRef.current?.click()}
                  />
                </>
              )}
              {isSupported && (
                <ToolbarButton
                  icon={isListening ? MicOff : Mic}
                  label={isListening ? t("voiceStop") : t("voiceStart")}
                  onClick={handleVoice}
                  active={isListening}
                  variant={isListening ? "destructive" : undefined}
                />
              )}
            </div>
          </div>

          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-xs text-destructive overflow-hidden"
              >
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                {t("voiceListening")}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline truncate max-w-[200px] px-2 py-1 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                  {url.split("/").pop()}
                </a>
              ))}
            </div>
          )}

          {/* Tools Bar */}
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs border-border/40 rounded-xl"
              onClick={() => setShowAI(!showAI)}
            >
              ✨ {showAI ? t("hideAITools") : t("showAITools")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs border-border/40 rounded-xl"
              onClick={() => setShowDrawing(true)}
            >
              <PenTool className="w-3.5 h-3.5 mr-1" /> {t("drawingCanvas")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs border-border/40 rounded-xl"
              onClick={() => setShowOCR(!showOCR)}
            >
              <ScanText className="w-3.5 h-3.5 mr-1" /> {showOCR ? t("hideOCR") : t("ocrTitle")}
            </Button>
          </div>

          <AnimatePresence>
            {showAI && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <AIToolsPanel
                  content={content}
                  onApply={(text) => setContent(text)}
                  onApplyTags={(newTags) => {
                    setTags((prev) => [...new Set([...prev, ...newTags.map((t) => t.toLowerCase())])]);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showOCR && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <OCRPanel onApplyText={(text) => setContent((prev) => (prev ? prev + "\n\n" : "") + text)} />
              </motion.div>
            )}
          </AnimatePresence>

          <DrawingCanvas
            open={showDrawing}
            onClose={() => setShowDrawing(false)}
            onSaveAsImage={async (dataUrl) => {
              if (note) {
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const file = new File([blob], `drawing_${Date.now()}.png`, { type: "image/png" });
                setUploading(true);
                const url = await uploadAttachment(note.id, file);
                if (url) setAttachments((prev) => [...prev, url]);
                setUploading(false);
              }
              setShowDrawing(false);
              toast({ title: t("drawingSaved") });
            }}
            onExtractText={async (dataUrl) => {
              setShowDrawing(false);
              try {
                const text = await processCanvasOCR(dataUrl);
                setContent((prev) => (prev ? prev + "\n\n" : "") + text);
                toast({ title: t("textExtracted") });
              } catch (e: any) {
                toast({ title: t("error"), description: e.message, variant: "destructive" });
              }
            }}
          />

          {!focusMode && (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">{t("category")}</label>
                <div className="flex flex-wrap gap-1.5">
                  {categoryKeys.map((key, i) => (
                    <button
                      key={key}
                      onClick={() => setCategory(categoryValues[i])}
                      className={`text-xs px-3.5 py-1.5 rounded-full transition-all duration-200 font-medium ${
                        category === categoryValues[i]
                          ? "gradient-primary text-primary-foreground shadow-sm"
                          : "bg-card border border-border/60 text-secondary-foreground hover:border-primary/20"
                      }`}
                    >
                      {t(key)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">{t("tags")}</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((tag) => (
                    <motion.span
                      key={tag}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </motion.span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("addTag")}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    className="text-sm border-border/40 bg-card rounded-xl"
                  />
                  <Button size="sm" variant="secondary" onClick={addTag} type="button" className="rounded-xl">
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
            <Button variant="ghost" onClick={onClose} className="rounded-xl">
              {t("cancel")}
            </Button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={handleSave} className="gradient-primary text-primary-foreground rounded-xl shadow-glass ripple-btn">
                {note ? t("saveChanges") : t("createNote")}
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
