import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

interface PinLockProps {
  onComplete: (pin: string) => void;
  maxLength?: number;
}

export function PinLock({ onComplete, maxLength = 4 }: PinLockProps) {
  const [pin, setPin] = useState("");

  const handleDigit = (digit: string) => {
    const next = pin + digit;
    if (next.length <= maxLength) {
      setPin(next);
      if (next.length === maxLength) {
        onComplete(next);
        setTimeout(() => setPin(""), 300);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="flex flex-col items-center gap-6">
      {/* PIN dots */}
      <div className="flex gap-3">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-4 h-4 rounded-full border-2 transition-all duration-200",
              i < pin.length
                ? "border-primary bg-primary scale-110 shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
                : "border-muted-foreground/40"
            )}
          />
        ))}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3">
        {digits.map((d, i) => {
          if (d === "") return <div key={i} />;
          if (d === "del") {
            return (
              <Button
                key={i}
                variant="ghost"
                className="w-16 h-16 rounded-full text-muted-foreground hover:bg-secondary"
                onClick={handleDelete}
              >
                <Delete className="w-5 h-5" />
              </Button>
            );
          }
          return (
            <Button
              key={i}
              variant="outline"
              className="w-16 h-16 rounded-full text-xl font-semibold border-border/50 hover:bg-primary/10 hover:border-primary/50 transition-all"
              onClick={() => handleDigit(d)}
            >
              {d}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
