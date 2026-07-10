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
        "inline-block bg-gradient-to-r from-indigo-500 to-primary bg-clip-text text-transparent transition-all duration-300 ease-out leading-[1.25] pb-[0.1em]",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        className
      )}
    >
      {words[index]}
    </span>
  );
}
