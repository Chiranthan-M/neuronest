import { useState, useRef, useCallback } from "react";
import { Archive, Trash2 } from "lucide-react";
import { useNotes } from "@/contexts/NotesContext";
import { Note } from "@/types/note";
import { NoteCard } from "./NoteCard";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";

const SWIPE_THRESHOLD = 80;
const SWIPE_COMMIT = 140;

interface SwipeableNoteCardProps {
  note: Note;
  onClick: () => void;
  showRestore?: boolean;
  compact?: boolean;
}

export function SwipeableNoteCard({ note, onClick, showRestore, compact }: SwipeableNoteCardProps) {
  const { toggleArchive, trashNote, restoreNote } = useNotes();
  const x = useMotionValue(0);
  const [swiping, setSwiping] = useState(false);
  const hasCommitted = useRef(false);

  // Right swipe → archive (positive x)
  const archiveOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const archiveScale = useTransform(x, [0, SWIPE_THRESHOLD, SWIPE_COMMIT], [0.5, 1, 1.2]);

  // Left swipe → trash (negative x)
  const trashOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const trashScale = useTransform(x, [-SWIPE_COMMIT, -SWIPE_THRESHOLD, 0], [1.2, 1, 0.5]);

  const archiveBg = useTransform(x, [0, SWIPE_THRESHOLD, SWIPE_COMMIT], [
    "hsl(152 60% 42% / 0)",
    "hsl(152 60% 42% / 0.15)",
    "hsl(152 60% 42% / 0.25)",
  ]);
  const trashBg = useTransform(x, [-SWIPE_COMMIT, -SWIPE_THRESHOLD, 0], [
    "hsl(0 80% 60% / 0.25)",
    "hsl(0 80% 60% / 0.15)",
    "hsl(0 80% 60% / 0)",
  ]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const offset = info.offset.x;

    if (offset > SWIPE_COMMIT && !showRestore) {
      hasCommitted.current = true;
      animate(x, 400, { duration: 0.25 }).then(() => {
        if (note.isArchived) {
          toggleArchive(note.id); // unarchive
        } else {
          toggleArchive(note.id);
        }
      });
    } else if (offset < -SWIPE_COMMIT) {
      hasCommitted.current = true;
      animate(x, -400, { duration: 0.25 }).then(() => {
        if (showRestore) {
          restoreNote(note.id);
        } else {
          trashNote(note.id);
        }
      });
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
    }
    setSwiping(false);
  }, [note.id, note.isArchived, showRestore, toggleArchive, trashNote, restoreNote, x]);

  // Only enable swipe on touch devices
  const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  if (!isTouchDevice) {
    return <NoteCard note={note} onClick={onClick} showRestore={showRestore} compact={compact} />;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Archive background (right swipe) */}
      {!showRestore && (
        <motion.div
          className="absolute inset-0 flex items-center justify-start pl-5 rounded-2xl"
          style={{ background: archiveBg }}
        >
          <motion.div
            style={{ opacity: archiveOpacity, scale: archiveScale }}
            className="flex flex-col items-center gap-1"
          >
            <Archive className="w-5 h-5 text-success" />
            <span className="text-[10px] font-semibold text-success">Archive</span>
          </motion.div>
        </motion.div>
      )}

      {/* Trash/Restore background (left swipe) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-5 rounded-2xl"
        style={{ background: trashBg }}
      >
        <motion.div
          style={{ opacity: trashOpacity, scale: trashScale }}
          className="flex flex-col items-center gap-1"
        >
          <Trash2 className={cn("w-5 h-5", showRestore ? "text-success" : "text-destructive")} />
          <span className={cn("text-[10px] font-semibold", showRestore ? "text-success" : "text-destructive")}>
            {showRestore ? "Restore" : "Delete"}
          </span>
        </motion.div>
      </motion.div>

      {/* Swipeable card */}
      <motion.div
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragElastic={0.15}
        dragConstraints={{ left: -200, right: showRestore ? 0 : 200 }}
        onDragStart={() => setSwiping(true)}
        onDragEnd={handleDragEnd}
        className="relative z-10"
      >
        <div
          onClick={(e) => {
            if (!swiping && !hasCommitted.current) onClick();
            hasCommitted.current = false;
          }}
          className="pointer-events-auto"
        >
          <NoteCard note={note} onClick={() => {}} showRestore={showRestore} compact={compact} />
        </div>
      </motion.div>
    </div>
  );
}
