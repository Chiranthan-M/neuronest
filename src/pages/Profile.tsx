import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Loader2, Camera, User } from "lucide-react";
import { motion } from "framer-motion";

export default function Profile() {
  const { user, isGuest } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user || isGuest) { setLoading(false); return; }
    supabase
      .from("profiles")
      .select("display_name, bio, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error("[Profile] Fetch error:", error);
        if (data) {
          setDisplayName(data.display_name ?? "");
          setBio(data.bio ?? "");
          setAvatarUrl(data.avatar_url);
        }
        setLoading(false);
      });
  }, [user, isGuest]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, bio })
      .eq("user_id", user.id);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("profileSaved") });
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("note-attachments")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: t("error"), description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("note-attachments")
      .getPublicUrl(path);

    const publicUrl = urlData.publicUrl + "?t=" + Date.now();

    await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("user_id", user.id);

    setAvatarUrl(publicUrl);
    setUploading(false);
    toast({ title: t("profileSaved") });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-lg mx-auto space-y-8"
    >
      <h1 className="text-3xl font-bold tracking-tight">{t("profileSettings")}</h1>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          <Avatar className="w-28 h-28 text-2xl border-4 border-background shadow-premium">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <label className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-250 cursor-pointer">
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-background" />
            ) : (
              <Camera className="w-5 h-5 text-background" />
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">{t("clickToChangeAvatar")}</p>
      </div>

      {/* Fields */}
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("email")}</label>
          <Input value={user?.email ?? ""} disabled className="bg-secondary/20 rounded-xl h-11" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("displayName")}</label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-card border-border/60 rounded-xl h-11" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("bio")}</label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t("bioPlaceholder")}
            className="bg-card border-border/60 min-h-[120px] rounded-xl"
          />
        </div>
      </div>

      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground rounded-xl h-11 shadow-glass ripple-btn">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {t("saveChanges")}
        </Button>
      </motion.div>
    </motion.div>
  );
}
