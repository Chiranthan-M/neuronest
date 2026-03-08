import { useState, useRef, useCallback } from "react";

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export function useVoiceToText() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const finalPartsRef = useRef<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCommittedRef = useRef("");

  const deduplicateTrailing = (existing: string, incoming: string): string => {
    if (!existing || !incoming) return incoming;
    const existingWords = existing.trimEnd().split(/\s+/);
    const incomingWords = incoming.trimStart().split(/\s+/);

    // Find overlap: check if the end of existing matches the start of incoming
    let overlapLen = 0;
    const maxCheck = Math.min(existingWords.length, incomingWords.length);
    for (let len = 1; len <= maxCheck; len++) {
      const tail = existingWords.slice(-len).join(" ");
      const head = incomingWords.slice(0, len).join(" ");
      if (tail.toLowerCase() === head.toLowerCase()) {
        overlapLen = len;
      }
    }
    if (overlapLen > 0) {
      return incomingWords.slice(overlapLen).join(" ");
    }
    return incoming;
  };

  const startListening = useCallback((onResult?: (text: string) => void) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Use Chrome or Edge.");
      return;
    }

    finalPartsRef.current = [];
    lastCommittedRef.current = "";

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Rebuild from all results each time to avoid index drift
      const finals: string[] = [];
      let currentInterim = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finals.push(text);
        } else {
          currentInterim += text;
        }
      }

      // Deduplicate: only add new final parts
      const newFinalText = finals.join("");
      const dedupedNew = deduplicateTrailing(lastCommittedRef.current, newFinalText);
      
      if (newFinalText !== lastCommittedRef.current) {
        lastCommittedRef.current = newFinalText;
      }

      // Build full transcript: all finals + current interim (interim is display-only)
      const fullFinal = newFinalText;
      const display = currentInterim ? fullFinal + currentInterim : fullFinal;

      // Debounce the callback to avoid rapid-fire updates
      if (debounceRef.current) clearTimeout(debounceRef.current);
      
      setTranscript(display);

      debounceRef.current = setTimeout(() => {
        // Only send final text to the callback (no interim)
        onResult?.(fullFinal);
      }, 150);
    };

    recognition.onerror = (e: any) => {
      // On network errors, don't kill the session for recoverable errors
      if (e.error === "no-speech" || e.error === "aborted") return;
      setIsListening(false);
    };

    recognition.onend = () => {
      // Auto-restart for continuous dictation if still supposed to be listening
      if (recognitionRef.current === recognition && isListening) {
        try {
          recognition.start();
          return;
        } catch {
          // fall through to stop
        }
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript("");
  }, [isListening]);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    recognitionRef.current = null; // prevent auto-restart in onend
    rec?.stop();
    setIsListening(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const isSupported =
    typeof window !== "undefined" &&
    !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );

  return { isListening, transcript, startListening, stopListening, isSupported };
}
