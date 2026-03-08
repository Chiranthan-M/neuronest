import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseSmartEditorOptions {
  content: string;
  enabled?: boolean;
}

interface Correction {
  original: string;
  corrected: string;
  reason: string;
}

export function useSmartEditor({ content, enabled = true }: UseSmartEditorOptions) {
  const [ghostText, setGhostText] = useState("");
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [completionLoading, setCompletionLoading] = useState(false);
  const [correctionLoading, setCorrectionLoading] = useState(false);

  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const correctionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCompletionText = useRef("");
  const lastCorrectionText = useRef("");
  const abortRef = useRef<AbortController | null>(null);

  // Fetch autocomplete suggestion
  const fetchCompletion = useCallback(async (text: string) => {
    if (!text.trim() || text.trim().length < 10) {
      setGhostText("");
      return;
    }
    // Only complete if cursor is at end and text changed
    if (text.trim() === lastCompletionText.current) return;
    lastCompletionText.current = text.trim();

    try {
      setCompletionLoading(true);
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const { data, error } = await supabase.functions.invoke("ai-tools", {
        body: { tool: "autocomplete", content: text },
      });

      if (!error && data?.result) {
        const suggestion = data.result.trim();
        // Only show if it's a reasonable continuation
        if (suggestion && suggestion.length > 0 && suggestion.length < 200) {
          setGhostText(suggestion);
        } else {
          setGhostText("");
        }
      }
    } catch {
      // Silent fail for autocomplete
    } finally {
      setCompletionLoading(false);
    }
  }, []);

  // Fetch autocorrect suggestions
  const fetchCorrections = useCallback(async (text: string) => {
    if (!text.trim() || text.trim().length < 15) {
      setCorrections([]);
      return;
    }
    if (text.trim() === lastCorrectionText.current) return;
    lastCorrectionText.current = text.trim();

    try {
      setCorrectionLoading(true);
      const { data, error } = await supabase.functions.invoke("ai-tools", {
        body: { tool: "autocorrect", content: text },
      });

      if (!error && data?.result) {
        try {
          // Try to parse JSON from the result
          let jsonStr = data.result.trim();
          // Handle markdown code blocks
          if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.replace(/```(?:json)?\n?/g, "").trim();
          }
          const parsed = JSON.parse(jsonStr);
          if (parsed?.corrections && Array.isArray(parsed.corrections)) {
            setCorrections(parsed.corrections);
          }
        } catch {
          setCorrections([]);
        }
      }
    } catch {
      // Silent fail
    } finally {
      setCorrectionLoading(false);
    }
  }, []);

  // Debounced completion - 1.5s after stop typing
  useEffect(() => {
    if (!enabled) return;
    if (completionTimer.current) clearTimeout(completionTimer.current);
    completionTimer.current = setTimeout(() => {
      fetchCompletion(content);
    }, 1500);
    return () => {
      if (completionTimer.current) clearTimeout(completionTimer.current);
    };
  }, [content, enabled, fetchCompletion]);

  // Debounced correction - 3s after stop typing
  useEffect(() => {
    if (!enabled) return;
    if (correctionTimer.current) clearTimeout(correctionTimer.current);
    correctionTimer.current = setTimeout(() => {
      fetchCorrections(content);
    }, 3000);
    return () => {
      if (correctionTimer.current) clearTimeout(correctionTimer.current);
    };
  }, [content, enabled, fetchCorrections]);

  // Clear ghost text when content changes (user typed)
  useEffect(() => {
    setGhostText("");
  }, [content]);

  const acceptCompletion = useCallback(() => {
    const text = ghostText;
    setGhostText("");
    return text;
  }, [ghostText]);

  const applyCorrection = useCallback((correction: Correction, currentContent: string) => {
    const newContent = currentContent.replace(correction.original, correction.corrected);
    setCorrections((prev) => prev.filter((c) => c.original !== correction.original));
    return newContent;
  }, []);

  const dismissCorrection = useCallback((correction: Correction) => {
    setCorrections((prev) => prev.filter((c) => c.original !== correction.original));
  }, []);

  return {
    ghostText,
    corrections,
    completionLoading,
    correctionLoading,
    acceptCompletion,
    applyCorrection,
    dismissCorrection,
    setGhostText,
  };
}
