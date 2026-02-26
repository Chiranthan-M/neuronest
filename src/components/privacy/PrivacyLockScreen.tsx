import { useState } from "react";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PatternLock } from "./PatternLock";
import { PinLock } from "./PinLock";
import { Button } from "@/components/ui/button";
import { Lock, Grid3X3, Hash, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface PrivacyLockScreenProps {
  onUnlocked: () => void;
}

export function PrivacyLockScreen({ onUnlocked }: PrivacyLockScreenProps) {
  const { isSetup, lockType, setupLock, unlock } = usePrivacy();
  const { t } = useLanguage();
  const [mode, setMode] = useState<"pin" | "pattern">(lockType ?? "pin");
  const [setupStep, setSetupStep] = useState<"choose" | "create" | "confirm">(isSetup ? "confirm" : "choose");
  const [firstValue, setFirstValue] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const handleSetupChoose = (type: "pin" | "pattern") => {
    setMode(type);
    setSetupStep("create");
  };

  const handleCreate = (value: string) => {
    setFirstValue(value);
    setSetupStep("confirm");
  };

  const handleConfirmSetup = (value: string) => {
    if (value === firstValue) {
      setupLock(mode, value);
      toast({ title: t("privateFolderReady"), description: t("privateLockSet") });
      onUnlocked();
    } else {
      setError(true);
      toast({ title: t("patternMismatch"), variant: "destructive" });
      setTimeout(() => {
        setError(false);
        setSetupStep("create");
        setFirstValue(null);
      }, 1000);
    }
  };

  const handleUnlock = (value: string) => {
    if (unlock(value)) {
      onUnlocked();
    } else {
      setError(true);
      toast({ title: t("incorrectLock"), variant: "destructive" });
      setTimeout(() => setError(false), 600);
    }
  };

  // Setup flow: choose method
  if (!isSetup && setupStep === "choose") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glass-lg">
          <ShieldCheck className="w-8 h-8 text-primary-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold">{t("setupPrivateFolder")}</h2>
          <p className="text-sm text-muted-foreground max-w-xs">{t("setupPrivateDesc")}</p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-6 px-8 border-border/50 hover:border-primary/50 hover:bg-primary/5"
            onClick={() => handleSetupChoose("pattern")}
          >
            <Grid3X3 className="w-8 h-8 text-primary" />
            <span className="text-sm font-medium">{t("patternLock")}</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-6 px-8 border-border/50 hover:border-primary/50 hover:bg-primary/5"
            onClick={() => handleSetupChoose("pin")}
          >
            <Hash className="w-8 h-8 text-primary" />
            <span className="text-sm font-medium">{t("pinLock")}</span>
          </Button>
        </div>
      </div>
    );
  }

  // Setup flow: create/confirm
  if (!isSetup && (setupStep === "create" || setupStep === "confirm")) {
    return (
      <div className={cn("flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in", error && "animate-shake")}>
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center">
          <Lock className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold">
            {setupStep === "create" ? t("createYourLock") : t("confirmYourLock")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {mode === "pattern" ? t("drawPattern") : t("enterPin")}
          </p>
        </div>
        {mode === "pattern" ? (
          <PatternLock onComplete={setupStep === "create" ? handleCreate : handleConfirmSetup} />
        ) : (
          <PinLock onComplete={setupStep === "create" ? handleCreate : handleConfirmSetup} />
        )}
      </div>
    );
  }

  // Unlock flow
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in", error && "animate-shake")}>
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
        error ? "bg-destructive/20" : "gradient-primary"
      )}>
        {error ? (
          <AlertCircle className="w-6 h-6 text-destructive" />
        ) : (
          <Lock className="w-6 h-6 text-primary-foreground" />
        )}
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold">{t("unlockPrivate")}</h2>
        <p className="text-xs text-muted-foreground">
          {lockType === "pattern" ? t("drawPattern") : t("enterPin")}
        </p>
      </div>
      {lockType === "pattern" ? (
        <PatternLock onComplete={handleUnlock} />
      ) : (
        <PinLock onComplete={handleUnlock} />
      )}
    </div>
  );
}
