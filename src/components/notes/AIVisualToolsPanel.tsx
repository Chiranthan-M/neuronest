import { useState } from "react";
import { useAIVisualTools, VisualTool } from "@/hooks/useAIVisualTools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MindMapView } from "./MindMapView";
import { DiagramView } from "./DiagramView";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wand2,
  Brain,
  GitFork,
  Paintbrush,
  Loader2,
  X,
  Download,
  RefreshCw,
  ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AIVisualToolsPanelProps {
  noteContent: string;
  onInsertImage?: (dataUrl: string) => void;
}

const imageStyles = [
  { value: "illustration", label: "Illustration" },
  { value: "realistic", label: "Realistic" },
  { value: "sketch", label: "Sketch" },
  { value: "cartoon", label: "Cartoon" },
  { value: "3d", label: "3D Render" },
  { value: "watercolor", label: "Watercolor" },
];

const diagramTypes = [
  { value: "flowchart", label: "Flowchart" },
  { value: "sequence", label: "Sequence" },
  { value: "process", label: "Process" },
  { value: "state", label: "State" },
];

export function AIVisualToolsPanel({ noteContent, onInsertImage }: AIVisualToolsPanelProps) {
  const { runVisualTool, loading, imageUrl, diagramCode, mindMapData, reset } = useAIVisualTools();
  const [activeTool, setActiveTool] = useState<VisualTool | null>(null);
  const [prompt, setPrompt] = useState("");
  const [imageStyle, setImageStyle] = useState("illustration");
  const [diagramType, setDiagramType] = useState("flowchart");

  const tools = [
    { id: "generate_image" as VisualTool, icon: Wand2, label: "Image Wand", color: "text-primary" },
    { id: "generate_mindmap" as VisualTool, icon: Brain, label: "Mind Map", color: "text-primary" },
    { id: "generate_diagram" as VisualTool, icon: GitFork, label: "Diagram", color: "text-primary" },
  ];

  const handleSelectTool = (tool: VisualTool) => {
    reset();
    setActiveTool(activeTool === tool ? null : tool);
    // Pre-fill prompt from note content if short enough
    if (noteContent.trim().length > 0 && noteContent.trim().length < 200) {
      setPrompt(noteContent.trim());
    }
  };

  const handleGenerate = async () => {
    if (!activeTool || !prompt.trim()) return;
    const style = activeTool === "generate_image" ? imageStyle : activeTool === "generate_diagram" ? diagramType : undefined;
    await runVisualTool(activeTool, prompt, style);
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleClose = () => {
    reset();
    setActiveTool(null);
    setPrompt("");
  };

  const hasResult = imageUrl || diagramCode || mindMapData;

  return (
    <div className="space-y-3">
      {/* Tool buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Paintbrush className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">Visual AI</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              size="sm"
              variant={activeTool === tool.id ? "default" : "secondary"}
              className={cn(
                "text-xs h-8 gap-1.5",
                activeTool === tool.id && "gradient-primary text-primary-foreground"
              )}
              onClick={() => handleSelectTool(tool.id)}
            >
              <tool.icon className="w-3.5 h-3.5" />
              {tool.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tool input panel */}
      <AnimatePresence mode="wait">
        {activeTool && (
          <motion.div
            key={activeTool}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3 bg-secondary/30 rounded-xl p-3 border border-border/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                {activeTool === "generate_image" && "✨ Image Wand"}
                {activeTool === "generate_mindmap" && "🧠 Mind Map Generator"}
                {activeTool === "generate_diagram" && "📊 Diagram Generator"}
              </span>
              <button onClick={handleClose} className="p-1 rounded hover:bg-secondary transition-colors">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            <Input
              placeholder={
                activeTool === "generate_image"
                  ? "Describe the image you want..."
                  : activeTool === "generate_mindmap"
                  ? "Enter a topic for the mind map..."
                  : "Describe the process or system..."
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleGenerate()}
              className="text-sm border-border/40 bg-card rounded-xl"
            />

            <div className="flex items-center gap-2">
              {activeTool === "generate_image" && (
                <Select value={imageStyle} onValueChange={setImageStyle}>
                  <SelectTrigger className="w-[140px] h-8 text-xs bg-card border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {imageStyles.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-xs">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {activeTool === "generate_diagram" && (
                <Select value={diagramType} onValueChange={setDiagramType}>
                  <SelectTrigger className="w-[140px] h-8 text-xs bg-card border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {diagramTypes.map((d) => (
                      <SelectItem key={d.value} value={d.value} className="text-xs">
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button
                size="sm"
                className="text-xs h-8 gradient-primary text-primary-foreground gap-1.5"
                disabled={loading || !prompt.trim()}
                onClick={handleGenerate}
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                Generate
              </Button>
            </div>

            {/* Loading animation */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center py-6"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Wand2 className="w-5 h-5 text-primary" />
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Results */}
            <AnimatePresence>
              {imageUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  <img
                    src={imageUrl}
                    alt="AI Generated"
                    className="w-full rounded-xl border border-border/40 shadow-sm"
                  />
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="secondary" className="text-xs h-7" onClick={handleRegenerate}>
                      <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                    </Button>
                    {onInsertImage && (
                      <Button
                        size="sm"
                        className="text-xs h-7 gradient-primary text-primary-foreground"
                        onClick={() => onInsertImage(imageUrl)}
                      >
                        <ImageIcon className="w-3 h-3 mr-1" /> Insert into Note
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs h-7"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = imageUrl;
                        a.download = `ai-image-${Date.now()}.png`;
                        a.click();
                      }}
                    >
                      <Download className="w-3 h-3 mr-1" /> Save
                    </Button>
                  </div>
                </motion.div>
              )}

              {diagramCode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  <DiagramView code={diagramCode} />
                  <Button size="sm" variant="secondary" className="text-xs h-7" onClick={handleRegenerate}>
                    <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                  </Button>
                </motion.div>
              )}

              {mindMapData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  <MindMapView data={mindMapData} />
                  <Button size="sm" variant="secondary" className="text-xs h-7" onClick={handleRegenerate}>
                    <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
