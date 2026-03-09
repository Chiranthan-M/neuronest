import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type VisualTool = "generate_image" | "generate_diagram" | "generate_mindmap";

export interface MindMapNode {
  label: string;
  children?: MindMapNode[];
}

export interface MindMapData {
  topic: string;
  branches: MindMapNode[];
}

export function useAIVisualTools() {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [diagramCode, setDiagramCode] = useState<string | null>(null);
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);

  const reset = () => {
    setImageUrl(null);
    setDiagramCode(null);
    setMindMapData(null);
  };

  const runVisualTool = async (
    tool: VisualTool,
    content: string,
    style?: string
  ) => {
    if (!content.trim()) return null;
    setLoading(true);
    reset();

    try {
      const { data, error } = await supabase.functions.invoke("ai-visual-tools", {
        body: { tool, content, style },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "AI Error", description: data.error, variant: "destructive" });
        return null;
      }

      if (tool === "generate_image" && data?.imageUrl) {
        setImageUrl(data.imageUrl);
        return data.imageUrl;
      }

      if (tool === "generate_diagram" && data?.result) {
        // Extract mermaid code from result
        const mermaidMatch = data.result.match(/```mermaid\n([\s\S]*?)```/);
        const code = mermaidMatch ? mermaidMatch[1].trim() : data.result.trim();
        setDiagramCode(code);
        return code;
      }

      if (tool === "generate_mindmap" && data?.result) {
        try {
          let jsonStr = data.result.trim();
          if (jsonStr.startsWith("```")) jsonStr = jsonStr.replace(/```(?:json)?\n?/g, "").trim();
          const parsed = JSON.parse(jsonStr) as MindMapData;
          setMindMapData(parsed);
          return parsed;
        } catch {
          toast({ title: "Error", description: "Failed to parse mind map data", variant: "destructive" });
          return null;
        }
      }

      return data?.result || null;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to run visual tool",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { runVisualTool, loading, imageUrl, diagramCode, mindMapData, reset, setImageUrl, setDiagramCode, setMindMapData };
}
