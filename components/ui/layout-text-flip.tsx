"use client";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const LayoutTextFlip = ({
  words,
  duration = 3000,
  className,
  text,
}: {
  words: string[];
  duration?: number;
  className?: string;
  text?: string;
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, duration);
    return () => clearInterval(interval);
  }, [words, duration]);

  return (
    <div className={cn("inline-flex flex-col md:flex-row items-center justify-center gap-2 text-center", className)}>
      {text && (
        <span className="text-4xl md:text-7xl font-bold text-slate-900 dark:text-white tracking-tight">
          {text}
        </span>
      )}
      <div className="relative inline-flex overflow-hidden items-center justify-start py-2">
        <span className="opacity-0 text-4xl md:text-7xl font-bold tracking-tight px-8">
          {words.reduce((a, b) => (a.length > b.length ? a : b))}
        </span>
        
        <AnimatePresence mode="wait">
          <motion.span
            key={words[index]}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center text-4xl md:text-7xl font-bold text-cyan-500 dark:text-cyan-400 whitespace-nowrap tracking-tight"
          >
            {words[index]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
};
