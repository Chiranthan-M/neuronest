import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Note } from "@/types/note";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface NotesContextType {
  notes: Note[];
  loading: boolean;
  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt" | "isTrashed">) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => void;
  trashNote: (id: string) => void;
  restoreNote: (id: string) => void;
  permanentlyDelete: (id: string) => void;
  togglePin: (id: string) => void;
  toggleArchive: (id: string) => void;
  togglePrivate: (id: string) => void;
  uploadAttachment: (noteId: string, file: File) => Promise<string | null>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = "neuronest_guest_notes";

function loadGuestNotes(): Note[] {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveGuestNotes(notes: Note[]) {
  try { localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(notes)); } catch {}
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const { user, isGuest } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch from Supabase for authenticated users
  const fetchNotes = useCallback(async () => {
    if (isGuest) {
      setNotes(loadGuestNotes());
      setLoading(false);
      return;
    }
    if (!user) { setNotes([]); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Notes] Fetch error:", error.message, error.details, error.hint);
        toast({ title: "Error", description: `Failed to load notes: ${error.message}`, variant: "destructive" });
      } else {
        setNotes(
          (data || []).map((n: any) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            tags: n.tags || [],
            category: n.category,
            isPinned: n.is_pinned,
            isArchived: n.is_archived,
            isTrashed: n.is_trashed,
            isPrivate: n.is_private,
            attachments: n.attachments || [],
            createdAt: n.created_at,
            updatedAt: n.updated_at,
          }))
        );
      }
    } catch (err: any) {
      console.error("[Notes] Network error:", err);
      toast({ title: "Connection Error", description: err?.message || "Failed to fetch notes. Check your internet connection.", variant: "destructive" });
    }
    setLoading(false);
  }, [user, isGuest]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  // Guest helpers
  const guestAdd = useCallback((note: Omit<Note, "id" | "createdAt" | "updatedAt" | "isTrashed">) => {
    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isTrashed: false,
      attachments: [],
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    saveGuestNotes(updated);
  }, [notes]);

  const guestUpdate = useCallback((id: string, updates: Partial<Note>) => {
    const updated = notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n);
    setNotes(updated);
    saveGuestNotes(updated);
  }, [notes]);

  const guestDelete = useCallback((id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    saveGuestNotes(updated);
  }, [notes]);

  const addNote = useCallback(async (note: Omit<Note, "id" | "createdAt" | "updatedAt" | "isTrashed">) => {
    if (isGuest) { guestAdd(note); return; }
    if (!user) return;
    try {
      const { error } = await supabase.from("notes").insert({
        user_id: user.id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        category: note.category,
        is_pinned: note.isPinned,
        is_archived: note.isArchived,
        is_private: note.isPrivate || false,
      });
      if (error) {
        console.error("[Notes] Add error:", error);
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        await fetchNotes();
      }
    } catch (err: any) {
      console.error("[Notes] Add network error:", err);
      toast({ title: "Error", description: err?.message || "Failed to add note", variant: "destructive" });
    }
  }, [user, isGuest, fetchNotes, guestAdd]);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    if (isGuest) { guestUpdate(id, updates); return; }
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
    if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;
    if (updates.isTrashed !== undefined) dbUpdates.is_trashed = updates.isTrashed;
    if (updates.isPrivate !== undefined) dbUpdates.is_private = updates.isPrivate;

    try {
      const { error } = await supabase.from("notes").update(dbUpdates).eq("id", id);
      if (error) {
        console.error("[Notes] Update error:", error);
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        await fetchNotes();
      }
    } catch (err: any) {
      console.error("[Notes] Update network error:", err);
      toast({ title: "Error", description: err?.message || "Failed to update note", variant: "destructive" });
    }
  }, [fetchNotes, isGuest, guestUpdate]);

  const deleteNote = useCallback((id: string) => {
    if (isGuest) { guestDelete(id); return; }
    supabase.from("notes").delete().eq("id", id).then(({ error }) => {
      if (error) console.error("[Notes] Delete error:", error);
      fetchNotes();
    });
  }, [fetchNotes, isGuest, guestDelete]);

  const trashNote = useCallback((id: string) => {
    if (isGuest) { guestUpdate(id, { isTrashed: true, isPinned: false, isArchived: false }); return; }
    supabase.from("notes").update({ is_trashed: true, is_pinned: false, is_archived: false }).eq("id", id).then(({ error }) => {
      if (error) console.error("[Notes] Trash error:", error);
      fetchNotes();
    });
  }, [fetchNotes, isGuest, guestUpdate]);

  const restoreNote = useCallback((id: string) => {
    if (isGuest) { guestUpdate(id, { isTrashed: false }); return; }
    supabase.from("notes").update({ is_trashed: false }).eq("id", id).then(({ error }) => {
      if (error) console.error("[Notes] Restore error:", error);
      fetchNotes();
    });
  }, [fetchNotes, isGuest, guestUpdate]);

  const permanentlyDelete = useCallback((id: string) => {
    if (isGuest) { guestDelete(id); return; }
    supabase.from("notes").delete().eq("id", id).then(({ error }) => {
      if (error) console.error("[Notes] Permanent delete error:", error);
      fetchNotes();
    });
  }, [fetchNotes, isGuest, guestDelete]);

  const togglePin = useCallback((id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    if (isGuest) { guestUpdate(id, { isPinned: !note.isPinned }); return; }
    supabase.from("notes").update({ is_pinned: !note.isPinned }).eq("id", id).then(({ error }) => {
      if (error) console.error("[Notes] Toggle pin error:", error);
      fetchNotes();
    });
  }, [notes, fetchNotes, isGuest, guestUpdate]);

  const toggleArchive = useCallback((id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    if (isGuest) { guestUpdate(id, { isArchived: !note.isArchived, isPinned: false }); return; }
    supabase.from("notes").update({ is_archived: !note.isArchived, is_pinned: false }).eq("id", id).then(({ error }) => {
      if (error) console.error("[Notes] Toggle archive error:", error);
      fetchNotes();
    });
  }, [notes, fetchNotes, isGuest, guestUpdate]);

  const togglePrivate = useCallback((id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    if (isGuest) { guestUpdate(id, { isPrivate: !note.isPrivate }); return; }
    supabase.from("notes").update({ is_private: !note.isPrivate }).eq("id", id).then(({ error }) => {
      if (error) console.error("[Notes] Toggle private error:", error);
      fetchNotes();
    });
  }, [notes, fetchNotes, isGuest, guestUpdate]);

  const uploadAttachment = useCallback(async (noteId: string, file: File): Promise<string | null> => {
    if (isGuest) {
      toast({ title: "Guest Mode", description: "File uploads require an account. Please sign up.", variant: "destructive" });
      return null;
    }
    if (!user) return null;
    try {
      const filePath = `${user.id}/${noteId}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("note-attachments").upload(filePath, file);
      if (error) {
        console.error("[Notes] Upload error:", error);
        toast({ title: "Upload Error", description: error.message, variant: "destructive" });
        return null;
      }
      const { data: urlData } = supabase.storage.from("note-attachments").getPublicUrl(filePath);
      return urlData.publicUrl;
    } catch (err: any) {
      console.error("[Notes] Upload network error:", err);
      toast({ title: "Upload Error", description: err?.message || "Upload failed", variant: "destructive" });
      return null;
    }
  }, [user, isGuest]);

  return (
    <NotesContext.Provider
      value={{ notes, loading, addNote, updateNote, deleteNote, trashNote, restoreNote, permanentlyDelete, togglePin, toggleArchive, togglePrivate, uploadAttachment }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes must be used within NotesProvider");
  return ctx;
}
