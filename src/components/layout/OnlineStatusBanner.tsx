import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { WifiOff, Wifi, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export function OnlineStatusBanner({ syncing }: { syncing?: boolean }) {
  const isOnline = useOnlineStatus();
  const [showOnline, setShowOnline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowOnline(true);
      const t = setTimeout(() => {
        setShowOnline(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showOnline && !syncing) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all",
        !isOnline
          ? "bg-destructive/90 text-destructive-foreground"
          : syncing
          ? "bg-primary/90 text-primary-foreground"
          : "bg-green-600 text-white"
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4" />
          You're offline — changes will sync when you reconnect
        </>
      ) : syncing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Syncing your changes...
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4" />
          Back online!
        </>
      )}
    </div>
  );
}
