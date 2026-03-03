import { useState, useEffect, useCallback } from "react";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}

// Offline mutation queue
const OFFLINE_QUEUE_KEY = "neuronest_offline_queue";

export interface OfflineMutation {
  id: string;
  type: "add" | "update" | "delete";
  table: string;
  payload: any;
  timestamp: number;
}

export function getOfflineQueue(): OfflineMutation[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(mutation: Omit<OfflineMutation, "id" | "timestamp">) {
  const queue = getOfflineQueue();
  queue.push({
    ...mutation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function clearOfflineQueue() {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

// Local notes cache for offline reads
const OFFLINE_CACHE_KEY = "neuronest_offline_cache";

export function getCachedNotes() {
  try {
    const raw = localStorage.getItem(OFFLINE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedNotes(notes: any[]) {
  try {
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(notes));
  } catch {}
}
