export function AnimatedBorder({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-[3px] ${className}`}>
      <div
        aria-hidden
        className="absolute -inset-[150%] animate-spin-slow"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0%, rgba(99,102,241,0.95) 12%, transparent 28%, transparent 72%, rgba(217,70,239,0.85) 88%, transparent 100%)"
        }}
      />
      <div className="relative rounded-2xl bg-white">{children}</div>
    </div>
  );
}
