"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  disableTilt?: boolean;
}

export function TiltCard({ children, className, glowColor = "rgba(234, 179, 8, 0.15)", disableTilt = false, ...props }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7.5deg", "-7.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7.5deg", "7.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Atualiza variáveis CSS para o efeito de holofote (spotlight) seguir o cursor
    ref.current.style.setProperty("--mouse-x", `${mouseX}px`);
    ref.current.style.setProperty("--mouse-y", `${mouseY}px`);

    if (!disableTilt) {
      const xPct = mouseX / width - 0.5;
      const yPct = mouseY / height - 0.5;
      x.set(xPct);
      y.set(yPct);
    }
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.setProperty("--mouse-x", "50%");
    ref.current.style.setProperty("--mouse-y", "50%");
    x.set(0);
    y.set(0);
  };

  const isTilting = !disableTilt;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={isTilting ? {
        rotateY,
        rotateX,
        transformStyle: "preserve-3d",
      } : {}}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative rounded-2xl bg-[#121214]/60 border border-[#27272A] p-6 backdrop-blur-md transition-colors duration-300 hover:border-yellow-500/30 hover:bg-[#161619]/80 shadow-[0_10px_30px_rgba(0,0,0,0.5)] group",
        className
      )}
      {...props}
    >
      <div 
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glowColor}, transparent 40%)`,
        }}
      />
      <div style={isTilting ? { transform: "translateZ(20px)" } : {}} className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
