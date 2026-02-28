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

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!user) { setNotes([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const addNote = useCallback(async (note: Omit<Note, "id" | "createdAt" | "updatedAt" | "isTrashed">) => {
    if (!user) return;
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
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await fetchNotes();
    }
  }, [user, fetchNotes]);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
    if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;
    if (updates.isTrashed !== undefined) dbUpdates.is_trashed = updates.isTrashed;
    if (updates.isPrivate !== undefined) dbUpdates.is_private = updates.isPrivate;

    const { error } = await supabase.from("notes").update(dbUpdates).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await fetchNotes();
    }
  }, [fetchNotes]);

  const deleteNote = useCallback((id: string) => {
    supabase.from("notes").delete().eq("id", id).then(() => fetchNotes());
  }, [fetchNotes]);

  const trashNote = useCallback((id: string) => {
    supabase.from("notes").update({ is_trashed: true, is_pinned: false, is_archived: false }).eq("id", id).then(() => fetchNotes());
  }, [fetchNotes]);

  const restoreNote = useCallback((id: string) => {
    supabase.from("notes").update({ is_trashed: false }).eq("id", id).then(() => fetchNotes());
  }, [fetchNotes]);

  const permanentlyDelete = useCallback((id: string) => {
    supabase.from("notes").delete().eq("id", id).then(() => fetchNotes());
  }, [fetchNotes]);

  const togglePin = useCallback((id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note) supabase.from("notes").update({ is_pinned: !note.isPinned }).eq("id", id).then(() => fetchNotes());
  }, [notes, fetchNotes]);

  const toggleArchive = useCallback((id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note) supabase.from("notes").update({ is_archived: !note.isArchived, is_pinned: false }).eq("id", id).then(() => fetchNotes());
  }, [notes, fetchNotes]);

  const togglePrivate = useCallback((id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note) supabase.from("notes").update({ is_private: !note.isPrivate }).eq("id", id).then(() => fetchNotes());
  }, [notes, fetchNotes]);

  const uploadAttachment = useCallback(async (noteId: string, file: File): Promise<string | null> => {
    if (!user) return null;
    const filePath = `${user.id}/${noteId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("note-attachments").upload(filePath, file);
    if (error) {
      toast({ title: "Upload Error", description: error.message, variant: "destructive" });
      return null;
    }
    const { data: urlData } = supabase.storage.from("note-attachments").getPublicUrl(filePath);
    return urlData.publicUrl;
  }, [user]);

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
