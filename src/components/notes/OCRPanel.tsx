import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ScanText, Upload, Loader2, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface OCRPanelProps {
  onApplyText: (text: string) => void;
}

export function OCRPanel({ onApplyText }: OCRPanelProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const processImage = async (imageDataUrl: string) => {
    setLoading(true);
    setResult("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-tools", {
        body: { tool: "ocr", content: imageDataUrl },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.result || "No text detected.");
    } catch (e: any) {
      toast({ title: t("error"), description: e.message || "OCR failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: t("error"), description: "Please upload an image file", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      processImage(dataUrl);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Exposed for DrawingCanvas to call
  (OCRPanel as any).__processImage = processImage;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ScanText className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{t("ocrTitle")}</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      <Button
        variant="outline"
        size="sm"
        className="w-full border-dashed border-border/50"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
      >
        <Upload className="w-4 h-4 mr-2" />
        {t("uploadImageForOCR")}
      </Button>

      {preview && (
        <div className="rounded-lg overflow-hidden border border-border/50 max-h-32">
          <img src={preview} alt="OCR preview" className="w-full h-full object-contain" />
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("extractingText")}
        </div>
      )}

      {result && !loading && (
        <div className="space-y-2">
          <div className="bg-secondary/30 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-40 overflow-auto border border-border/50">
            {result}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copied ? t("copied") : t("copy")}
            </Button>
            <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => onApplyText(result)}>
              {t("aiApply")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to process canvas images externally
export async function processCanvasOCR(imageDataUrl: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ai-tools", {
    body: { tool: "ocr", content: imageDataUrl },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.result || "No text detected.";
}
