import { useState, useEffect } from "react";
import { Note } from "@/types/note";
import { useNotes } from "@/contexts/NotesContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus } from "lucide-react";

interface NoteEditorProps {
  note?: Note | null;
  open: boolean;
  onClose: () => void;
}

const categories = ["General", "Programming", "Computer Science", "Projects", "Personal", "Work"];

export function NoteEditor({ note, open, onClose }: NoteEditorProps) {
  const { addNote, updateNote } = useNotes();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [category, setCategory] = useState("General");

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
  }, [note, open]);

  const handleSave = () => {
    if (!title.trim()) return;
    if (note) {
      updateNote(note.id, { title, content, tags, category });
    } else {
      addNote({ title, content, tags, category, isPinned: false, isArchived: false });
    }
    onClose();
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass sm:max-w-[600px] max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {note ? "Edit Note" : "Create Note"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Input
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base font-medium border-border/50 bg-secondary/30 focus-visible:ring-primary/30"
          />

          <Textarea
            placeholder="Start writing..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px] resize-none border-border/50 bg-secondary/30 focus-visible:ring-primary/30 leading-relaxed"
          />

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                    category === cat
                      ? "gradient-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tags</label>
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
                placeholder="Add tag..."
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
              Cancel
            </Button>
            <Button onClick={handleSave} className="gradient-primary text-primary-foreground">
              {note ? "Save Changes" : "Create Note"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
