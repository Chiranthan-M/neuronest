import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      {/* Primary blob */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.04] dark:opacity-[0.06]"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary)), transparent 70%)",
          top: "-10%",
          left: "-5%",
          filter: "blur(80px)",
        }}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.08, 0.95, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Accent blob */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.03] dark:opacity-[0.05]"
        style={{
          background: "radial-gradient(circle, hsl(var(--accent)), transparent 70%)",
          bottom: "-10%",
          right: "-5%",
          filter: "blur(80px)",
        }}
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 25, -15, 0],
          scale: [1, 0.95, 1.06, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Tertiary subtle blob */}
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full opacity-[0.02] dark:opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, hsl(var(--success)), transparent 70%)",
          top: "40%",
          left: "50%",
          filter: "blur(100px)",
        }}
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -40, 30, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
