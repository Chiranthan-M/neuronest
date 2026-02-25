import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type AITool =
  | "summarize"
  | "improve_writing"
  | "change_tone"
  | "plagiarism_check"
  | "smart_tags"
  | "productivity_analytics";

export function useAITools() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const runTool = async (
    tool: AITool,
    content: string,
    options?: { tone?: string; notesData?: any }
  ) => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-tools", {
        body: { tool, content, tone: options?.tone, notesData: options?.notesData },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "AI Error", description: data.error, variant: "destructive" });
        return null;
      }

      setResult(data.result);
      return data.result as string;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to run AI tool",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { runTool, loading, result, setResult };
}
