import { useState, useEffect } from "react";
import { Note } from "@/types/note";
import { useNotes } from "@/contexts/NotesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useVoiceToText } from "@/hooks/useVoiceToText";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Mic, MicOff } from "lucide-react";
import { AIToolsPanel } from "./AIToolsPanel";

interface NoteEditorProps {
  note?: Note | null;
  open: boolean;
  onClose: () => void;
  isPrivate?: boolean;
}

const categoryKeys = ["general", "programming", "computerScience", "projects", "personal", "work"] as const;
const categoryValues = ["General", "Programming", "Computer Science", "Projects", "Personal", "Work"];

export function NoteEditor({ note, open, onClose, isPrivate = false }: NoteEditorProps) {
  const { addNote, updateNote } = useNotes();
  const { t } = useLanguage();
  const { isListening, startListening, stopListening, isSupported } = useVoiceToText();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [category, setCategory] = useState("General");
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags);
      setCategory(note.category);
    } else {
      setTitle("");
      setContent("");
      setTags([]);
      setTagInput("");
      setCategory("General");
    }
    setShowAI(false);
  }, [note, open]);

  const handleSave = () => {
    if (!title.trim()) return;
    if (note) {
      updateNote(note.id, { title, content, tags, category });
    } else {
      addNote({ title, content, tags, category, isPinned: false, isArchived: false, isPrivate });
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass sm:max-w-[650px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {note ? t("editNote") : t("createNote")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Input
            placeholder={t("noteTitle")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base font-medium border-border/50 bg-secondary/30 focus-visible:ring-primary/30"
          />

          <div className="relative">
            <Textarea
              placeholder={t("startWriting")}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[180px] resize-none border-border/50 bg-secondary/30 focus-visible:ring-primary/30 leading-relaxed pr-12"
            />
            {isSupported && (
              <Button
                type="button"
                size="sm"
                variant={isListening ? "destructive" : "secondary"}
                className="absolute bottom-2 right-2 h-8 w-8 p-0"
                onClick={handleVoice}
                title={isListening ? t("voiceStop") : t("voiceStart")}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </Button>
            )}
          </div>

          {isListening && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              {t("voiceListening")}
            </div>
          )}

          {/* AI Tools Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs border-border/50"
            onClick={() => setShowAI(!showAI)}
          >
            ✨ {showAI ? t("hideAITools") : t("showAITools")}
          </Button>

          {showAI && (
            <AIToolsPanel
              content={content}
              onApply={(text) => setContent(text)}
              onApplyTags={(newTags) => {
                setTags((prev) => [...new Set([...prev, ...newTags.map((t) => t.toLowerCase())])]);
              }}
            />
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("category")}</label>
            <div className="flex flex-wrap gap-1.5">
              {categoryKeys.map((key, i) => (
                <button
                  key={key}
                  onClick={() => setCategory(categoryValues[i])}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                    category === categoryValues[i]
                      ? "gradient-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("tags")}</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={t("addTag")}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="text-sm border-border/50 bg-secondary/30"
              />
              <Button size="sm" variant="secondary" onClick={addTag} type="button">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSave} className="gradient-primary text-primary-foreground">
              {note ? t("saveChanges") : t("createNote")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
