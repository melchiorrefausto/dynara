export function HeroParticles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden sm:h-[520px]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(99,102,241,0.14) 0px, rgba(99,102,241,0.14) 1px, transparent 1px, transparent 96px)",
          maskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)"
        }}
      />
      <div className="absolute left-1/2 top-0 h-[340px] w-[680px] -translate-x-1/2 animate-pulse-glow rounded-full bg-primary/15 blur-[110px]" />
    </div>
  );
}
