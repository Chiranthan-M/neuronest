import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface VoiceWaveformProps {
  isActive: boolean;
}

const BAR_COUNT = 24;

export function VoiceWaveform({ isActive }: VoiceWaveformProps) {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array>(new Uint8Array(BAR_COUNT));
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isActive) {
      // Reset bars
      barsRef.current.forEach((bar) => {
        if (bar) bar.style.height = "4px";
      });
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      analyserRef.current = null;
      cancelAnimationFrame(rafRef.current);
      return;
    }

    let cancelled = false;

    async function setup() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);
        analyserRef.current = analyser;
        draw();
      } catch {
        // Mic access denied — show idle animation
      }
    }

    function draw() {
      if (cancelled) return;
      const analyser = analyserRef.current;
      if (analyser) {
        const freq = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freq);
        // Map frequency bins to bars
        const step = Math.max(1, Math.floor(freq.length / BAR_COUNT));
        for (let i = 0; i < BAR_COUNT; i++) {
          const val = freq[Math.min(i * step, freq.length - 1)] / 255;
          const h = Math.max(4, val * 32);
          if (barsRef.current[i]) barsRef.current[i]!.style.height = `${h}px`;
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    }

    setup();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center justify-center gap-[3px] py-3 px-4 rounded-xl bg-destructive/5 border border-destructive/15"
    >
      <div className="flex items-center gap-1 mr-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
        </span>
        <span className="text-[11px] font-medium text-destructive ml-1.5">Listening</span>
      </div>
      <div className="flex items-end gap-[2px] h-8">
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <div
            key={i}
            ref={(el) => { barsRef.current[i] = el; }}
            className="w-[3px] rounded-full bg-destructive/70 transition-[height] duration-75"
            style={{
              height: "4px",
              animationDelay: `${i * 40}ms`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
