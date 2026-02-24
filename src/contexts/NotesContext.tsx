import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Note } from "@/types/note";

interface NotesContextType {
  notes: Note[];
  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt" | "isTrashed">) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  trashNote: (id: string) => void;
  restoreNote: (id: string) => void;
  permanentlyDelete: (id: string) => void;
  togglePin: (id: string) => void;
  toggleArchive: (id: string) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const STORAGE_KEY = "neuronest_notes";

const defaultNotes: Note[] = [
  {
    id: "1",
    title: "Getting Started with NeuroNest",
    content: "Welcome to NeuroNest! This is your smart knowledge hub. You can create, organize, and manage your notes efficiently.\n\n**Features:**\n- Pin important notes\n- Archive old notes\n- Tag and categorize\n- Search instantly",
    tags: ["welcome", "guide"],
    category: "General",
    isPinned: true,
    isArchived: false,
    isTrashed: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "2",
    title: "React Hooks Deep Dive",
    content: "useState, useEffect, useCallback, useMemo, useRef - understanding when and how to use each hook effectively in React applications.\n\nKey takeaways:\n- useState for simple state\n- useReducer for complex state\n- useEffect for side effects\n- useMemo for expensive computations",
    tags: ["react", "hooks", "javascript"],
    category: "Programming",
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "3",
    title: "Database Design Patterns",
    content: "Exploring different database design patterns for scalable applications.\n\n1. Normalization vs Denormalization\n2. Indexing strategies\n3. Sharding approaches\n4. CQRS pattern",
    tags: ["database", "architecture"],
    category: "Computer Science",
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "4",
    title: "Project Ideas for Portfolio",
    content: "- AI-powered chatbot\n- Real-time collaboration tool\n- E-commerce platform\n- Social media analytics dashboard\n- IoT monitoring system",
    tags: ["ideas", "portfolio"],
    category: "Projects",
    isPinned: true,
    isArchived: false,
    isTrashed: false,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "5",
    title: "Machine Learning Notes",
    content: "Supervised vs Unsupervised learning. Key algorithms: Linear Regression, Decision Trees, Random Forest, Neural Networks.\n\nImportant concepts:\n- Bias-Variance tradeoff\n- Overfitting prevention\n- Feature engineering\n- Cross-validation",
    tags: ["ml", "ai", "data-science"],
    category: "Computer Science",
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
];

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : defaultNotes;
    } catch {
      return defaultNotes;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const addNote = useCallback((note: Omit<Note, "id" | "createdAt" | "updatedAt" | "isTrashed">) => {
    const now = new Date().toISOString();
    setNotes((prev) => [
      {
        ...note,
        id: crypto.randomUUID(),
        isTrashed: false,
        createdAt: now,
        updatedAt: now,
      },
      ...prev,
    ]);
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n))
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const trashNote = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isTrashed: true, isPinned: false, isArchived: false, updatedAt: new Date().toISOString() } : n))
    );
  }, []);

  const restoreNote = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isTrashed: false, updatedAt: new Date().toISOString() } : n))
    );
  }, []);

  const permanentlyDelete = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const togglePin = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() } : n))
    );
  }, []);

  const toggleArchive = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isArchived: !n.isArchived, isPinned: false, updatedAt: new Date().toISOString() } : n))
    );
  }, []);

  return (
    <NotesContext.Provider
      value={{ notes, addNote, updateNote, deleteNote, trashNote, restoreNote, permanentlyDelete, togglePin, toggleArchive }}
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
