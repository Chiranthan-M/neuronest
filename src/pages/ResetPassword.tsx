import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Loader2, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: t("error"), description: t("passwordMinLength"), variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: t("error"), description: t("passwordsDoNotMatch"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } else {
      setDone(true);
      toast({ title: t("passwordResetSuccess") });
      setTimeout(() => navigate("/"), 2000);
    }
    setSubmitting(false);
  };

  if (!isRecovery && !done) {
    return (
      <div className="min-h-screen flex items-center justify-center app-bg px-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{t("verifyingResetLink")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center app-bg px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{t("resetPassword")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("enterNewPassword")}</p>
        </div>

        {done ? (
          <div className="glass rounded-2xl p-6 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="font-medium">{t("passwordResetSuccess")}</p>
            <p className="text-sm text-muted-foreground">{t("redirectingHome")}</p>
          </div>
        ) : (
          <div className="glass rounded-2xl p-6 space-y-5">
            <form onSubmit={handleReset} className="space-y-4">
              <Input
                type="password"
                placeholder={t("newPassword")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-secondary/30 border-border/50"
              />
              <Input
                type="password"
                placeholder={t("confirmNewPassword")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="bg-secondary/30 border-border/50"
              />
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("resetPassword")}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
