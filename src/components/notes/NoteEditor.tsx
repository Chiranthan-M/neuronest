import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import { X, Plus, Mic, MicOff, Paperclip, Loader2, PenTool, ScanText, Maximize2, Minimize2, Sparkles, Wand2, ChevronDown, ChevronUp, FileText, Clock } from "lucide-react";
import { AIToolsPanel } from "./AIToolsPanel";
import { AIVisualToolsPanel } from "./AIVisualToolsPanel";
import { DrawingCanvas } from "./DrawingCanvas";
import { OCRPanel, processCanvasOCR } from "./OCRPanel";
import { SlashCommandMenu } from "./SlashCommandMenu";
import { WritingAssistantBar } from "./WritingAssistantBar";
import { AutoCorrectBanner } from "./AutoCorrectBanner";
import { VoiceWaveform } from "./VoiceWaveform";
import { NoteTemplates, NoteTemplate } from "./NoteTemplates";
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
  const [showVisualAI, setShowVisualAI] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [aiToolbarExpanded, setAiToolbarExpanded] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
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
    setShowVisualAI(false);
    setShowDrawing(false);
    setShowOCR(false);
    setFocusMode(false);
    setShowAssistant(false);
    setAiToolbarExpanded(false);
    setShowTemplates(false);
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
      startListening((newChunk) => {
        // newChunk is ONLY the new final text, not cumulative
        setContent((prev) => {
          const needsSpace = prev.length > 0 && !prev.endsWith(" ") && !prev.endsWith("\n");
          return prev + (needsSpace ? " " : "") + newChunk.trim();
        });
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

  // Handle content change with slash command detection
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    // Detect slash commands
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPos);
    const lastNewline = textBeforeCursor.lastIndexOf("\n");
    const currentLine = textBeforeCursor.substring(lastNewline + 1);

    if (currentLine.startsWith("/") && currentLine.length >= 1) {
      const filter = currentLine.substring(1);
      setSlashCmd({ show: true, filter, pos: { top: 0, left: 0 } });
    } else {
      if (slashCmd.show) setSlashCmd({ show: false, filter: "", pos: { top: 0, left: 0 } });
    }
  }, [slashCmd.show]);

  // Handle slash command selection
  const handleSlashCommand = useCallback(async (commandId: string) => {
    // Remove the slash command text from content
    const cursorPos = textareaRef.current?.selectionStart || content.length;
    const textBeforeCursor = content.substring(0, cursorPos);
    const lastNewline = textBeforeCursor.lastIndexOf("\n");
    const beforeSlash = content.substring(0, lastNewline + 1);
    const afterCursor = content.substring(cursorPos);
    const cleanContent = (beforeSlash + afterCursor).trim();

    setSlashCmd({ show: false, filter: "", pos: { top: 0, left: 0 } });

    if (!cleanContent) {
      toast({ title: "No content to process", variant: "destructive" });
      return;
    }

    if (commandId === "translate") {
      setContent(cleanContent);
      setShowAI(true);
      return;
    }

    const res = await runTool(commandId as any, cleanContent);
    if (res) {
      if (commandId === "autocorrect") {
        // Grammar fix returns JSON, apply corrections
        try {
          let jsonStr = res.trim();
          if (jsonStr.startsWith("```")) jsonStr = jsonStr.replace(/```(?:json)?\n?/g, "").trim();
          const parsed = JSON.parse(jsonStr);
          if (parsed?.corrections) {
            let fixed = cleanContent;
            for (const c of parsed.corrections) {
              fixed = fixed.replace(c.original, c.corrected);
            }
            setContent(fixed);
            toast({ title: `Fixed ${parsed.corrections.length} issue(s)` });
          }
        } catch {
          setContent(cleanContent);
        }
      } else {
        setContent(res);
      }
    } else {
      setContent(cleanContent);
    }
  }, [content, runTool, toast]);

  // Handle Tab key to accept ghost completion
  const handleTextareaKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab" && ghostText) {
      e.preventDefault();
      const completion = acceptCompletion();
      if (completion) {
        setContent((prev) => prev + completion);
      }
    }
    if (e.key === "Escape" && slashCmd.show) {
      setSlashCmd({ show: false, filter: "", pos: { top: 0, left: 0 } });
    }
  }, [ghostText, acceptCompletion, slashCmd.show]);

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

  const wordCount = useMemo(() => content.trim() ? content.trim().split(/\s+/).length : 0, [content]);
  const lastEdited = note?.updatedAt ? new Date(note.updatedAt).toLocaleString() : null;

  const handleTemplateSelect = (template: NoteTemplate) => {
    setTitle(template.title);
    setContent(template.content);
    setCategory(template.category);
    setTags(template.tags);
    setShowTemplates(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={cn(
        "glass max-w-[calc(100vw-2rem)] sm:max-w-[80vw] sm:max-w-[min(80vw,1200px)] max-h-[90vh] sm:max-h-[85vh] overflow-auto rounded-2xl border-border/40 p-0",
        focusMode && "sm:max-w-[95vw] sm:max-h-[95vh]"
      )}>
        {/* Header zone */}
        <DialogHeader className="px-5 sm:px-6 pt-5 pb-3 border-b border-border/40 sticky top-0 z-10 bg-card/80 backdrop-blur-sm rounded-t-2xl">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {note ? t("editNote") : t("createNote")}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {/* Word count + last edited */}
              <div className="hidden sm:flex items-center gap-3 text-[10px] text-muted-foreground mr-2">
                <span>{wordCount} words</span>
                {lastEdited && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {lastEdited}
                  </span>
                )}
              </div>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <button onClick={() => setFocusMode(!focusMode)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                    {focusMode ? <Minimize2 className="w-4 h-4 text-muted-foreground" /> : <Maximize2 className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">{focusMode ? "Exit Fullscreen" : "Fullscreen"}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </DialogHeader>

        {/* Content zone */}
        <div className="space-y-4 px-5 sm:px-6 py-4">
          {/* Templates for new notes */}
          {!note && !title && !content && (
            <AnimatePresence>
              {!showTemplates ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-xl border-dashed border-border/60"
                    onClick={() => setShowTemplates(true)}
                  >
                    <FileText className="w-3.5 h-3.5 mr-1" />
                    Start from Template
                  </Button>
                </motion.div>
              ) : (
                <NoteTemplates
                  onSelect={handleTemplateSelect}
                  onClose={() => setShowTemplates(false)}
                />
              )}
            </AnimatePresence>
          )}

          <Input
            placeholder={t("noteTitle")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl sm:text-2xl font-semibold border-0 bg-transparent px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/40"
            style={{ fontFamily: "var(--editor-font-family, inherit)" }}
          />

          <div className="relative">
            {/* Ghost text overlay for autocomplete */}
            {ghostText && content && (
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl px-3 py-2 text-sm leading-relaxed"
                style={{
                  backgroundImage: focusMode ? 'repeating-linear-gradient(transparent, transparent 31px, transparent 31px, transparent 32px)' : 'none',
                  lineHeight: focusMode ? '32px' : undefined,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                <span className="invisible">{content}</span>
                <span className="text-muted-foreground/40 italic">{ghostText}</span>
              </div>
            )}

            <Textarea
              ref={textareaRef}
              placeholder={"Start writing... Use @ for AI commands"}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleTextareaKeyDown}
              spellCheck={true}
              className={cn(
                "resize-none border-border/40 bg-secondary/20 rounded-xl focus-visible:ring-primary/20 pr-12 p-5 sm:p-6",
                focusMode ? "min-h-[50vh]" : "min-h-[200px] sm:min-h-[280px]",
                ghostText && "caret-primary"
              )}
              style={{
                fontFamily: "var(--editor-font-family, inherit)",
                fontSize: "var(--editor-font-size, 1rem)",
                lineHeight: focusMode ? "32px" : "var(--editor-line-height, 1.6)",
                backgroundImage: focusMode ? 'repeating-linear-gradient(transparent, transparent 31px, hsl(var(--border) / 0.3) 31px, hsl(var(--border) / 0.3) 32px)' : 'none',
                backgroundPositionY: '8px',
              }}
            />

            {/* Ghost text hint */}
            {ghostText && (
              <div className="absolute bottom-2 left-3">
                <span className="text-[10px] text-muted-foreground/50 bg-secondary/60 px-1.5 py-0.5 rounded">
                  Tab ↹ to accept
                </span>
              </div>
            )}

            {/* Slash command menu - positioned above textarea */}
            {slashCmd.show && (
              <div className="absolute top-full left-0 mt-1 z-50">
                <SlashCommandMenu
                  show={slashCmd.show}
                  position={{ top: 0, left: 0 }}
                  filter={slashCmd.filter}
                  onSelect={handleSlashCommand}
                  onClose={() => setSlashCmd({ show: false, filter: "", pos: { top: 0, left: 0 } })}
                />
              </div>
            )}

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

          {/* Voice waveform */}
          <AnimatePresence>
            <VoiceWaveform isActive={isListening} />
          </AnimatePresence>

          {/* Auto-correct suggestions */}
          {corrections.length > 0 && (
            <AutoCorrectBanner
              corrections={corrections}
              onAccept={(c) => setContent(applyCorrection(c, content))}
              onDismiss={dismissCorrection}
            />
          )}


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

          {/* AI Toolbar — Collapsible */}
          <div className="border border-border/40 rounded-xl overflow-hidden bg-card/30">
            <button
              type="button"
              onClick={() => setAiToolbarExpanded(!aiToolbarExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium">AI Tools</span>
              </div>
              {aiToolbarExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>

            {/* Always-visible: Ask AI + toggle */}
            <div className="flex items-center gap-1.5 px-3 pb-2">
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn("text-xs border-border/40 rounded-xl", showAssistant && "gradient-primary text-primary-foreground border-0")}
                    onClick={() => setShowAssistant(!showAssistant)}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> Ask AI
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">AI writing assistant for your content</TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs border-border/40 rounded-xl"
                    onClick={() => setShowAI(!showAI)}
                  >
                    ✨ AI Actions
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Summarize, improve, change tone, and more</TooltipContent>
              </Tooltip>
            </div>

            {/* Expanded: More AI tools */}
            <AnimatePresence>
              {aiToolbarExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-1.5 px-3 pb-3 flex-wrap sm:flex-nowrap overflow-x-auto">
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn("text-xs border-border/40 rounded-xl whitespace-nowrap", showVisualAI && "gradient-primary text-primary-foreground border-0")}
                          onClick={() => setShowVisualAI(!showVisualAI)}
                        >
                          <Wand2 className="w-3.5 h-3.5 mr-1" /> Create Image
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Generate images from text or sketches</TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs border-border/40 rounded-xl whitespace-nowrap"
                          onClick={() => setShowOCR(!showOCR)}
                        >
                          <ScanText className="w-3.5 h-3.5 mr-1" /> Scan Text
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Extract text from images using OCR</TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs border-border/40 rounded-xl whitespace-nowrap"
                          onClick={() => setShowDrawing(true)}
                        >
                          <PenTool className="w-3.5 h-3.5 mr-1" /> Sketch
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Open freehand drawing canvas</TooltipContent>
                    </Tooltip>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Writing Assistant Bar */}
          <WritingAssistantBar
            content={content}
            onApply={(text) => setContent(text)}
            visible={showAssistant}
            onToggle={() => setShowAssistant(false)}
          />

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
            {showVisualAI && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <AIVisualToolsPanel
                  noteContent={content}
                  onInsertImage={(dataUrl) => {
                    setContent((prev) => prev + `\n\n![AI Generated Image](${dataUrl})\n`);
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

        </div>

        {/* Footer zone */}
        <div className="flex justify-end gap-2 px-5 sm:px-6 py-4 border-t border-border/40 sticky bottom-0 bg-card/80 backdrop-blur-sm rounded-b-2xl">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">
            {t("cancel")}
          </Button>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={handleSave} className="gradient-primary text-primary-foreground rounded-xl shadow-glass ripple-btn">
              {note ? t("saveChanges") : t("createNote")}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
