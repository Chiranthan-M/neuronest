import { useState, useRef, useCallback, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Pen,
  Paintbrush,
  Highlighter,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
  ScanText,
  Palette,
  Minus,
  Droplets,
} from "lucide-react";

type BrushType = "pen" | "marker" | "watercolor" | "highlighter" | "pencil" | "eraser";

interface CanvasState {
  imageData: ImageData;
}

interface DrawingCanvasProps {
  open: boolean;
  onClose: () => void;
  onSaveAsImage: (dataUrl: string) => void;
  onExtractText: (dataUrl: string) => void;
}

const BRUSH_CONFIGS: Record<BrushType, { opacity: number; compositeOp: GlobalCompositeOperation; softness: number }> = {
  pen: { opacity: 1, compositeOp: "source-over", softness: 0 },
  marker: { opacity: 0.7, compositeOp: "source-over", softness: 0 },
  watercolor: { opacity: 0.15, compositeOp: "source-over", softness: 8 },
  highlighter: { opacity: 0.3, compositeOp: "source-over", softness: 0 },
  pencil: { opacity: 0.6, compositeOp: "source-over", softness: 1 },
  eraser: { opacity: 1, compositeOp: "destination-out", softness: 0 },
};

const PRESET_COLORS = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
];

export function DrawingCanvas({ open, onClose, onSaveAsImage, onExtractText }: DrawingCanvasProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brush, setBrush] = useState<BrushType>("pen");
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState([3]);
  const [opacity, setOpacity] = useState([100]);
  const [undoStack, setUndoStack] = useState<CanvasState[]>([]);
  const [redoStack, setRedoStack] = useState<CanvasState[]>([]);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const getCtx = useCallback(() => canvasRef.current?.getContext("2d") ?? null, []);

  // Initialize canvas
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = Math.max(400, parent.clientHeight - 10);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveState();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [open]);

  const saveState = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack((prev) => [...prev.slice(-30), { imageData }]);
    setRedoStack([]);
  }, [getCtx]);

  const undo = useCallback(() => {
    const ctx = getCtx();
    if (!ctx || undoStack.length <= 1) return;
    const newUndo = [...undoStack];
    const current = newUndo.pop()!;
    setRedoStack((prev) => [...prev, current]);
    setUndoStack(newUndo);
    ctx.putImageData(newUndo[newUndo.length - 1].imageData, 0, 0);
  }, [getCtx, undoStack]);

  const redo = useCallback(() => {
    const ctx = getCtx();
    if (!ctx || redoStack.length === 0) return;
    const newRedo = [...redoStack];
    const state = newRedo.pop()!;
    setRedoStack(newRedo);
    setUndoStack((prev) => [...prev, state]);
    ctx.putImageData(state.imageData, 0, 0);
  }, [getCtx, redoStack]);

  const clearCanvas = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  }, [getCtx, saveState]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e);
    lastPoint.current = pos;

    const ctx = getCtx();
    if (!ctx) return;
    const config = BRUSH_CONFIGS[brush];
    ctx.globalCompositeOperation = config.compositeOp;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx || !lastPoint.current) return;

    const pos = getPos(e);
    const config = BRUSH_CONFIGS[brush];
    const userOpacity = opacity[0] / 100;
    const finalOpacity = config.opacity * userOpacity;

    ctx.globalCompositeOperation = config.compositeOp;
    ctx.globalAlpha = finalOpacity;
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth[0] + (brush === "highlighter" ? 8 : 0);
    ctx.lineCap = "round";

    if (config.softness > 0) {
      ctx.shadowBlur = config.softness;
      ctx.shadowColor = color;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPoint.current = pos;
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPoint.current = null;
    const ctx = getCtx();
    if (ctx) {
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
    saveState();
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return canvas.toDataURL("image/png");
  };

  const handleSave = () => {
    const dataUrl = exportImage();
    if (dataUrl) onSaveAsImage(dataUrl);
  };

  const handleOCR = () => {
    const dataUrl = exportImage();
    if (dataUrl) onExtractText(dataUrl);
  };

  const brushIcons: Record<BrushType, React.ReactNode> = {
    pen: <Pen className="w-4 h-4" />,
    marker: <Paintbrush className="w-4 h-4" />,
    watercolor: <Droplets className="w-4 h-4" />,
    highlighter: <Highlighter className="w-4 h-4" />,
    pencil: <Minus className="w-4 h-4" />,
    eraser: <Eraser className="w-4 h-4" />,
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass sm:max-w-[900px] max-h-[95vh] overflow-auto p-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{t("drawingCanvas")}</DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border/50">
          {/* Brushes */}
          <div className="flex gap-1">
            {(Object.keys(brushIcons) as BrushType[]).map((b) => (
              <Button
                key={b}
                size="sm"
                variant={brush === b ? "default" : "outline"}
                className={`h-8 w-8 p-0 ${brush === b ? "gradient-primary text-primary-foreground" : ""}`}
                onClick={() => setBrush(b)}
                title={t(b)}
              >
                {brushIcons[b]}
              </Button>
            ))}
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-1">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-0.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${color === c ? "border-primary scale-125" : "border-border/50"}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0"
            />
          </div>

          {/* Stroke Width */}
          <div className="flex items-center gap-2 min-w-[100px]">
            <span className="text-xs text-muted-foreground">{t("size")}</span>
            <Slider value={strokeWidth} onValueChange={setStrokeWidth} min={1} max={30} step={1} className="w-20" />
            <span className="text-xs font-mono w-5">{strokeWidth[0]}</span>
          </div>

          {/* Opacity */}
          <div className="flex items-center gap-2 min-w-[100px]">
            <span className="text-xs text-muted-foreground">{t("opacity")}</span>
            <Slider value={opacity} onValueChange={setOpacity} min={5} max={100} step={5} className="w-20" />
            <span className="text-xs font-mono w-7">{opacity[0]}%</span>
          </div>

          {/* Actions */}
          <div className="flex gap-1 ml-auto">
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={undo} disabled={undoStack.length <= 1} title={t("undo")}>
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={redo} disabled={redoStack.length === 0} title={t("redo")}>
              <Redo2 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={clearCanvas} title={t("clearCanvas")}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative border border-border/50 rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            className="w-full cursor-crosshair touch-none"
            style={{ minHeight: 400 }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-between pt-2">
          <Button variant="outline" size="sm" onClick={handleOCR}>
            <ScanText className="w-4 h-4 mr-2" /> {t("extractText")}
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>{t("cancel")}</Button>
            <Button onClick={handleSave} className="gradient-primary text-primary-foreground">
              <Download className="w-4 h-4 mr-2" /> {t("saveDrawing")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
