"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const words = ["every user", "every developer", "every designer", "every team"];

export function RotatingWord({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let hideTimeout: ReturnType<typeof setTimeout>;
    const interval = setInterval(() => {
      setVisible(false);
      hideTimeout = setTimeout(() => {
        setIndex((current) => (current + 1) % words.length);
        setVisible(true);
      }, 300);
    }, 2600);

    return () => {
      clearInterval(interval);
      clearTimeout(hideTimeout);
    };
  }, []);

  return (
    <span
      className={cn(
        "inline-block bg-[length:200%_auto] bg-gradient-to-r from-indigo-500 via-primary to-fuchsia-500 bg-clip-text leading-[1.25] pb-[0.1em] text-transparent",
        "animate-gradient-pan transition-all duration-300 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        className
      )}
    >
      {words[index]}
    </span>
  );
}
