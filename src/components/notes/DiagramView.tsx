import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiagramViewProps {
  code: string;
}

export function DiagramView({ code }: DiagramViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderMermaid() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
          securityLevel: "loose",
          flowchart: { useMaxWidth: true, htmlLabels: true },
        });
        const id = `mermaid-${Date.now()}`;
        const { svg: renderedSvg } = await mermaid.render(id, code);
        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to render diagram");
          setSvg(null);
        }
      }
    }

    renderMermaid();
    return () => { cancelled = true; };
  }, [code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-warning">
          <AlertTriangle className="w-4 h-4" />
          <span>Could not render diagram visually. Showing code:</span>
        </div>
        <pre className="text-xs bg-secondary/40 rounded-lg p-3 overflow-auto max-h-[200px] border border-border/40">
          <code>{code}</code>
        </pre>
        <Button size="sm" variant="ghost" className="text-xs h-7" onClick={handleCopy}>
          {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
          {copied ? "Copied" : "Copy Code"}
        </Button>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-2"
    >
      <div
        ref={containerRef}
        className="bg-card rounded-xl p-4 border border-border/40 overflow-auto max-h-[400px]"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={handleCopy}>
        {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
        {copied ? "Copied" : "Copy Mermaid Code"}
      </Button>
    </motion.div>
  );
}
