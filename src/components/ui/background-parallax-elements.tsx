"use client";

import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Coins, CreditCard, Percent, ShieldCheck, Banknote, Wallet } from "lucide-react";

export function BackgroundParallaxElements() {
  const { scrollYProgress } = useScroll();

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -250]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -350]);
  const y4 = useTransform(scrollYProgress, [0, 1], [0, 150]);

  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 45]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const rotate3 = useTransform(scrollYProgress, [0, 1], [0, 30]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      <motion.div
        style={{ y: y1, rotate: rotate1 }}
        className="absolute top-[12%] left-[4%] opacity-[0.07] text-yellow-500 blur-[0.5px]"
      >
        <Coins className="w-24 h-24 sm:w-36 sm:h-36 filter drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]" />
      </motion.div>

      <motion.div
        style={{ y: y2, rotate: rotate2 }}
        className="absolute top-[18%] right-[5%] opacity-[0.06] text-cyan-400 blur-[0.5px]"
      >
        <CreditCard className="w-28 h-28 sm:w-44 sm:h-44 filter drop-shadow-[0_0_25px_rgba(6,182,212,0.4)]" />
      </motion.div>

      <motion.div
        style={{ y: y3, rotate: rotate3 }}
        className="absolute top-[45%] left-[2%] opacity-[0.05] text-emerald-400"
      >
        <ShieldCheck className="w-32 h-32 sm:w-48 sm:h-48" />
      </motion.div>

      <motion.div
        style={{ y: y4, rotate: rotate1 }}
        className="absolute top-[52%] right-[3%] opacity-[0.06] text-yellow-400"
      >
        <Percent className="w-20 h-20 sm:w-32 sm:h-32" />
      </motion.div>

      <motion.div
        style={{ y: y2, rotate: rotate3 }}
        className="absolute top-[75%] left-[6%] opacity-[0.05] text-rose-400"
      >
        <Banknote className="w-28 h-28 sm:w-40 sm:h-40" />
      </motion.div>

      <motion.div
        style={{ y: y1, rotate: rotate2 }}
        className="absolute top-[80%] right-[7%] opacity-[0.06] text-amber-500"
      >
        <Wallet className="w-24 h-24 sm:w-36 sm:h-36" />
      </motion.div>

      <div className="absolute top-[25%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-yellow-500/[0.025] rounded-full blur-[160px]" />
      <div className="absolute top-[65%] left-[20%] w-[450px] h-[450px] bg-emerald-500/[0.02] rounded-full blur-[140px]" />
    </div>
  );
}
