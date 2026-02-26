import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PatternLockProps {
  onComplete: (pattern: string) => void;
  size?: number;
}

export function PatternLock({ onComplete, size = 3 }: PatternLockProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const dots = Array.from({ length: size * size }, (_, i) => i);

  const getDotFromPoint = useCallback((x: number, y: number): number | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const dotElements = containerRef.current.querySelectorAll("[data-dot]");
    for (let i = 0; i < dotElements.length; i++) {
      const dotRect = dotElements[i].getBoundingClientRect();
      const cx = dotRect.left + dotRect.width / 2;
      const cy = dotRect.top + dotRect.height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist < 28) return i;
    }
    return null;
  }, []);

  const handleStart = useCallback((x: number, y: number) => {
    const dot = getDotFromPoint(x, y);
    if (dot !== null) {
      setSelected([dot]);
      setIsDrawing(true);
    }
  }, [getDotFromPoint]);

  const handleMove = useCallback((x: number, y: number) => {
    if (!isDrawing) return;
    const dot = getDotFromPoint(x, y);
    if (dot !== null && !selected.includes(dot)) {
      setSelected((prev) => [...prev, dot]);
    }
  }, [isDrawing, selected, getDotFromPoint]);

  const handleEnd = useCallback(() => {
    if (isDrawing && selected.length >= 3) {
      onComplete(selected.join("-"));
    }
    setIsDrawing(false);
    setTimeout(() => setSelected([]), 300);
  }, [isDrawing, selected, onComplete]);

  useEffect(() => {
    const handleMouseUp = () => handleEnd();
    const handleTouchEnd = () => handleEnd();
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleEnd]);

  return (
    <div
      ref={containerRef}
      className="grid gap-6 select-none touch-none"
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, width: size * 72 }}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        const t = e.touches[0];
        handleStart(t.clientX, t.clientY);
      }}
      onTouchMove={(e) => {
        const t = e.touches[0];
        handleMove(t.clientX, t.clientY);
      }}
    >
      {dots.map((dot) => {
        const isActive = selected.includes(dot);
        const order = selected.indexOf(dot);
        return (
          <div
            key={dot}
            data-dot={dot}
            className="flex items-center justify-center w-14 h-14"
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 transition-all duration-150",
                isActive
                  ? "border-primary bg-primary scale-125 shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
                  : "border-muted-foreground/40 bg-transparent hover:border-primary/60"
              )}
            >
              {isActive && (
                <div className="w-full h-full rounded-full bg-primary-foreground/30 animate-pulse" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
