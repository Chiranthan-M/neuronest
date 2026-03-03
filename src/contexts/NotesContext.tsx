import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Note } from "@/types/note";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useOnlineStatus, addToOfflineQueue, getOfflineQueue, clearOfflineQueue, getCachedNotes, setCachedNotes } from "@/hooks/useOnlineStatus";

interface NotesContextType {
  notes: Note[];
  loading: boolean;
  syncing: boolean;
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

function mapDbToNote(n: any): Note {
  return {
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
  };
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const { user, isGuest } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const isOnline = useOnlineStatus();
  const syncingRef = useRef(false);

  // Fetch notes from Supabase or cache
  const fetchNotes = useCallback(async () => {
    if (isGuest) {
      setNotes(loadGuestNotes());
      setLoading(false);
      return;
    }
    if (!user) { setNotes([]); setLoading(false); return; }

    if (!navigator.onLine) {
      // Load from offline cache
      const cached = getCachedNotes();
      if (cached) setNotes(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Notes] Fetch error:", error.message, error.details, error.hint);
        toast({ title: "Error", description: `Failed to load notes: ${error.message}`, variant: "destructive" });
        // Fall back to cache
        const cached = getCachedNotes();
        if (cached) setNotes(cached);
      } else {
        const mapped = (data || []).map(mapDbToNote);
        setNotes(mapped);
        setCachedNotes(mapped);
      }
    } catch (err: any) {
      console.error("[Notes] Network error:", err);
      const cached = getCachedNotes();
      if (cached) {
        setNotes(cached);
        toast({ title: "Offline", description: "Showing cached notes. Changes will sync when online.", variant: "default" });
      } else {
        toast({ title: "Connection Error", description: err?.message || "Failed to fetch notes.", variant: "destructive" });
      }
    }
    setLoading(false);
  }, [user, isGuest]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  // Sync offline queue when coming back online
  const syncOfflineQueue = useCallback(async () => {
    if (!user || isGuest || syncingRef.current) return;
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    syncingRef.current = true;
    setSyncing(true);
    console.log(`[Notes] Syncing ${queue.length} offline mutations...`);

    try {
      for (const mutation of queue) {
        if (mutation.table !== "notes") continue;
        try {
          if (mutation.type === "add") {
            await supabase.from("notes").insert(mutation.payload);
          } else if (mutation.type === "update") {
            const { id, ...updates } = mutation.payload;
            await supabase.from("notes").update(updates).eq("id", id);
          } else if (mutation.type === "delete") {
            await supabase.from("notes").delete().eq("id", mutation.payload.id);
          }
        } catch (e) {
          console.error("[Notes] Failed to sync mutation:", mutation, e);
        }
      }
      clearOfflineQueue();
      await fetchNotes();
      toast({ title: "Synced", description: "Your offline changes have been saved." });
    } catch (err) {
      console.error("[Notes] Sync error:", err);
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [user, isGuest, fetchNotes]);

  useEffect(() => {
    if (isOnline && user && !isGuest) {
      syncOfflineQueue();
    }
  }, [isOnline, user, isGuest, syncOfflineQueue]);

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

  // Offline-aware Supabase operations
  const addNote = useCallback(async (note: Omit<Note, "id" | "createdAt" | "updatedAt" | "isTrashed">) => {
    if (isGuest) { guestAdd(note); return; }
    if (!user) return;

    const dbPayload = {
      user_id: user.id,
      title: note.title,
      content: note.content,
      tags: note.tags,
      category: note.category,
      is_pinned: note.isPinned,
      is_archived: note.isArchived,
      is_private: note.isPrivate || false,
    };

    if (!navigator.onLine) {
      addToOfflineQueue({ type: "add", table: "notes", payload: dbPayload });
      // Optimistic local update
      const optimistic: Note = {
        ...note, id: crypto.randomUUID(),
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        isTrashed: false, attachments: [],
      };
      setNotes(prev => { const updated = [optimistic, ...prev]; setCachedNotes(updated); return updated; });
      toast({ title: "Saved offline", description: "Will sync when you're back online." });
      return;
    }

    try {
      const { error } = await supabase.from("notes").insert(dbPayload);
      if (error) {
        console.error("[Notes] Add error:", error);
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        await fetchNotes();
      }
    } catch (err: any) {
      console.error("[Notes] Add network error:", err);
      addToOfflineQueue({ type: "add", table: "notes", payload: dbPayload });
      toast({ title: "Saved offline", description: "Will sync when you're back online." });
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

    // Optimistic update
    setNotes(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n);
      setCachedNotes(updated);
      return updated;
    });

    if (!navigator.onLine) {
      addToOfflineQueue({ type: "update", table: "notes", payload: { id, ...dbUpdates } });
      return;
    }

    try {
      const { error } = await supabase.from("notes").update(dbUpdates).eq("id", id);
      if (error) {
        console.error("[Notes] Update error:", error);
        toast({ title: "Error", description: error.message, variant: "destructive" });
        await fetchNotes(); // revert optimistic
      }
    } catch (err: any) {
      console.error("[Notes] Update network error:", err);
      addToOfflineQueue({ type: "update", table: "notes", payload: { id, ...dbUpdates } });
    }
  }, [fetchNotes, isGuest, guestUpdate]);

  const deleteNote = useCallback((id: string) => {
    if (isGuest) { guestDelete(id); return; }
    setNotes(prev => { const updated = prev.filter(n => n.id !== id); setCachedNotes(updated); return updated; });
    if (!navigator.onLine) {
      addToOfflineQueue({ type: "delete", table: "notes", payload: { id } });
      return;
    }
    supabase.from("notes").delete().eq("id", id).then(({ error }) => {
      if (error) console.error("[Notes] Delete error:", error);
      fetchNotes();
    });
  }, [fetchNotes, isGuest, guestDelete]);

  const trashNote = useCallback((id: string) => {
    if (isGuest) { guestUpdate(id, { isTrashed: true, isPinned: false, isArchived: false }); return; }
    const dbUpdates = { is_trashed: true, is_pinned: false, is_archived: false };
    setNotes(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isTrashed: true, isPinned: false, isArchived: false } : n);
      setCachedNotes(updated);
      return updated;
    });
    if (!navigator.onLine) {
      addToOfflineQueue({ type: "update", table: "notes", payload: { id, ...dbUpdates } });
      return;
    }
    supabase.from("notes").update(dbUpdates).eq("id", id).then(({ error }) => {
      if (error) console.error("[Notes] Trash error:", error);
      fetchNotes();
    });
  }, [fetchNotes, isGuest, guestUpdate]);

  const restoreNote = useCallback((id: string) => {
    if (isGuest) { guestUpdate(id, { isTrashed: false }); return; }
    setNotes(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isTrashed: false } : n);
      setCachedNotes(updated);
      return updated;
    });
    if (!navigator.onLine) {
      addToOfflineQueue({ type: "update", table: "notes", payload: { id, is_trashed: false } });
      return;
    }
    supabase.from("notes").update({ is_trashed: false }).eq("id", id).then(({ error }) => {
      if (error) console.error("[Notes] Restore error:", error);
      fetchNotes();
    });
  }, [fetchNotes, isGuest, guestUpdate]);

  const permanentlyDelete = useCallback((id: string) => {
    if (isGuest) { guestDelete(id); return; }
    setNotes(prev => { const updated = prev.filter(n => n.id !== id); setCachedNotes(updated); return updated; });
    if (!navigator.onLine) {
      addToOfflineQueue({ type: "delete", table: "notes", payload: { id } });
      return;
    }
    supabase.from("notes").delete().eq("id", id).then(({ error }) => {
      if (error) console.error("[Notes] Permanent delete error:", error);
      fetchNotes();
    });
  }, [fetchNotes, isGuest, guestDelete]);

  const togglePin = useCallback((id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    if (isGuest) { guestUpdate(id, { isPinned: !note.isPinned }); return; }
    updateNote(id, { isPinned: !note.isPinned });
  }, [notes, isGuest, guestUpdate, updateNote]);

  const toggleArchive = useCallback((id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    if (isGuest) { guestUpdate(id, { isArchived: !note.isArchived, isPinned: false }); return; }
    updateNote(id, { isArchived: !note.isArchived, isPinned: false });
  }, [notes, isGuest, guestUpdate, updateNote]);

  const togglePrivate = useCallback((id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    if (isGuest) { guestUpdate(id, { isPrivate: !note.isPrivate }); return; }
    updateNote(id, { isPrivate: !note.isPrivate });
  }, [notes, isGuest, guestUpdate, updateNote]);

  const uploadAttachment = useCallback(async (noteId: string, file: File): Promise<string | null> => {
    if (isGuest) {
      toast({ title: "Guest Mode", description: "File uploads require an account. Please sign up.", variant: "destructive" });
      return null;
    }
    if (!user) return null;
    if (!navigator.onLine) {
      toast({ title: "Offline", description: "File uploads require an internet connection.", variant: "destructive" });
      return null;
    }
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
      value={{ notes, loading, syncing, addNote, updateNote, deleteNote, trashNote, restoreNote, permanentlyDelete, togglePin, toggleArchive, togglePrivate, uploadAttachment }}
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
