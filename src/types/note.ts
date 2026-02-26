export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  isPinned: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  isPrivate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NoteFilter = "all" | "pinned" | "archived" | "trashed";
export type NoteSortBy = "newest" | "oldest" | "updated" | "title";
