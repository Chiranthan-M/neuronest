import { useState, useRef, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

/**
 * Robust voice-to-text hook with:
 * - Proper permission handling with user-friendly messages
 * - Duplicate-free output (only new final text is emitted)
 * - Auto-restart for continuous dictation
 * - Cross-browser support (Chrome, Edge, Safari)
 */
export function useVoiceToText() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const intentionalStopRef = useRef(false);
  const prevFinalLenRef = useRef(0);
  const callbackRef = useRef<((text: string) => void) | undefined>();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    recognitionRef.current = null;
    prevFinalLenRef.current = 0;
    setIsListening(false);
  }, []);

  const startListening = useCallback(async (onResult?: (text: string) => void) => {
    setError(null);
    callbackRef.current = onResult;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const msg = "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.";
      setError(msg);
      toast({ title: "Not Supported", description: msg, variant: "destructive" });
      return;
    }

    // Check microphone permission
    try {
      if (navigator.permissions) {
        const perm = await navigator.permissions.query({ name: "microphone" as PermissionName });
        if (perm.state === "denied") {
          const msg = "Microphone access is blocked. Please enable it in your browser settings.";
          setError(msg);
          toast({ title: "Permission Denied", description: msg, variant: "destructive" });
          return;
        }
      }
    } catch {
      // permissions API not available — we'll try to start anyway
    }

    // Stop any existing session
    if (recognitionRef.current) {
      intentionalStopRef.current = true;
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    // Track the length of final text we've already emitted
    prevFinalLenRef.current = 0;
    intentionalStopRef.current = false;

    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";

      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          finalText += r[0].transcript;
        } else {
          interimText += r[0].transcript;
        }
      }

      // Display: show everything (finals + interim)
      const display = finalText + (interimText ? interimText : "");
      setTranscript(display);

      // Only emit the NEW final text that hasn't been sent yet
      if (finalText.length > prevFinalLenRef.current) {
        const newChunk = finalText.slice(prevFinalLenRef.current);
        prevFinalLenRef.current = finalText.length;

        // Debounce to batch rapid finalizations
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          callbackRef.current?.(newChunk);
        }, 100);
      }
    };

    recognition.onerror = (e: any) => {
      console.warn("[VoiceToText] Error:", e.error);
      switch (e.error) {
        case "not-allowed":
          toast({
            title: "Microphone Blocked",
            description: "Please allow microphone access in your browser settings and try again.",
            variant: "destructive",
          });
          setError("Permission denied");
          cleanup();
          break;
        case "no-speech":
          // Recoverable — don't stop, recognition will auto-restart
          break;
        case "audio-capture":
          toast({
            title: "No Microphone",
            description: "No microphone was detected. Please connect one and try again.",
            variant: "destructive",
          });
          setError("No microphone detected");
          cleanup();
          break;
        case "network":
          toast({
            title: "Network Error",
            description: "Speech recognition requires an internet connection.",
            variant: "destructive",
          });
          setError("Network error");
          cleanup();
          break;
        case "aborted":
          // Intentional stop — ignore
          break;
        default:
          // Unknown error — attempt recovery
          break;
      }
    };

    recognition.onend = () => {
      // Auto-restart if we didn't intentionally stop
      if (!intentionalStopRef.current && recognitionRef.current === recognition) {
        try {
          recognition.start();
          return;
        } catch {
          // Failed to restart — clean up
        }
      }
      cleanup();
    };

    try {
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      setTranscript("");
      toast({ title: "Listening...", description: "Speak now. Your words will appear as text." });
    } catch (err: any) {
      console.error("[VoiceToText] Failed to start:", err);
      toast({
        title: "Failed to Start",
        description: "Could not start speech recognition. Please try again.",
        variant: "destructive",
      });
      cleanup();
    }
  }, [cleanup]);

  const stopListening = useCallback(() => {
    intentionalStopRef.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const rec = recognitionRef.current;
    if (rec) {
      try { rec.stop(); } catch {}
    }
    recognitionRef.current = null;
    prevFinalLenRef.current = 0;
    setIsListening(false);
  }, []);

  const isSupported =
    typeof window !== "undefined" &&
    !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );

  return { isListening, transcript, error, startListening, stopListening, isSupported };
}
