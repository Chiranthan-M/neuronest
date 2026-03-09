import { useState } from "react";
import { MindMapData, MindMapNode } from "@/hooks/useAIVisualTools";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface MindMapViewProps {
  data: MindMapData;
}

function BranchNode({ node, depth = 0, index = 0 }: { node: MindMapNode; depth?: number; index?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const colors = [
    "bg-primary/15 text-primary border-primary/30",
    "bg-accent/20 text-accent-foreground border-accent/40",
    "bg-secondary text-secondary-foreground border-border",
    "bg-muted text-muted-foreground border-border/60",
  ];
  const colorClass = colors[depth % colors.length];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="relative"
    >
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-px bg-border/40" style={{ left: -12 }} />
      )}
      <div className="flex items-start gap-1 mb-1">
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1.5 p-0.5 rounded hover:bg-secondary transition-colors shrink-0"
          >
            {expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border cursor-default", colorClass)}
        >
          {node.label}
        </motion.div>
      </div>
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-6 pl-3 border-l border-border/30 space-y-0.5"
          >
            {node.children!.map((child, i) => (
              <BranchNode key={i} node={child} depth={depth + 1} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function MindMapView({ data }: MindMapViewProps) {
  return (
    <div className="space-y-3">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20"
      >
        <Brain className="w-5 h-5 text-primary" />
        <span className="font-semibold text-sm text-primary">{data.topic}</span>
      </motion.div>
      <div className="space-y-1 pl-2">
        {data.branches.map((branch, i) => (
          <BranchNode key={i} node={branch} depth={0} index={i} />
        ))}
      </div>
    </div>
  );
}
