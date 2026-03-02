import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Loader2, UserRound, WifiOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const { user, loading, isGuest, connectionError, signIn, signUp, continueAsGuest } = useAuth();
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center app-bg">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user || isGuest) return <Navigate to="/" replace />;

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast({ title: t("error"), description: t("enterEmailFirst"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: t("error"), description: error.message, variant: "destructive" });
      } else {
        toast({ title: t("checkEmail"), description: t("resetLinkSent") });
      }
    } catch (err: any) {
      console.error("[Auth] Reset password error:", err);
      toast({ title: t("error"), description: err?.message || "Network error", variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: t("error"), description: error, variant: "destructive" });
      }
    } else {
      if (!displayName.trim()) {
        toast({ title: t("error"), description: "Display name is required", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      const { error } = await signUp(email, password, displayName);
      if (error) {
        toast({ title: t("error"), description: error, variant: "destructive" });
      } else {
        toast({ title: t("checkEmail"), description: t("confirmEmailSent") });
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center app-bg px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">NeuroNest</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("smartKnowledgeHub")}</p>
        </div>

        {connectionError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
            <WifiOff className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Connection Issue</p>
              <p className="text-xs text-muted-foreground mt-1">{connectionError}</p>
              <p className="text-xs text-muted-foreground mt-2">You can still use the app in Guest Mode below.</p>
            </div>
          </div>
        )}

        <div className="glass rounded-2xl p-6 space-y-5">
          <div className="flex rounded-lg bg-secondary/50 p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${isLogin ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >
              {t("signIn")}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${!isLogin ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >
              {t("signUp")}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                placeholder={t("displayName")}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="bg-secondary/30 border-border/50"
              />
            )}
            <Input
              type="email"
              placeholder={t("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-secondary/30 border-border/50"
            />
            <Input
              type="password"
              placeholder={t("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-secondary/30 border-border/50"
            />
            {isLogin && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-primary hover:underline"
              >
                {t("forgotPassword")}
              </button>
            )}
            <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLogin ? t("signIn") : t("signUp")}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t("or") || "or"}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-border/50"
            onClick={continueAsGuest}
          >
            <UserRound className="w-4 h-4 mr-2" />
            {t("continueAsGuest") || "Continue as Guest"}
          </Button>
        </div>
      </div>
    </div>
  );
}
