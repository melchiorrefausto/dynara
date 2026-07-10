const particles = [
  { top: "8%", left: "78%", size: 5, delay: 0, duration: 7 },
  { top: "18%", left: "92%", size: 3, delay: 1.2, duration: 6 },
  { top: "30%", left: "68%", size: 4, delay: 2.4, duration: 8 },
  { top: "42%", left: "88%", size: 3, delay: 0.6, duration: 5.5 },
  { top: "55%", left: "76%", size: 5, delay: 1.8, duration: 7.5 },
  { top: "14%", left: "58%", size: 3, delay: 3, duration: 6.5 },
  { top: "65%", left: "94%", size: 4, delay: 2, duration: 6 },
  { top: "4%", left: "85%", size: 4, delay: 0.9, duration: 7 },
  { top: "48%", left: "62%", size: 3, delay: 2.7, duration: 6.8 },
  { top: "72%", left: "82%", size: 3, delay: 1.5, duration: 7.2 }
];

export function HeroParticles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[560px] overflow-hidden">
      <div
        className="absolute inset-0 animate-grid-drift opacity-[0.55]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.7) 1.5px, transparent 1.5px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse 60% 75% at 82% 20%, black 0%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 75% at 82% 20%, black 0%, transparent 72%)"
        }}
      />
      {particles.map((particle, index) => (
        <span
          key={index}
          className="absolute animate-particle-float rounded-full bg-primary/60"
          style={{
            top: particle.top,
            left: particle.left,
            width: particle.size,
            height: particle.size,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`
          }}
        />
      ))}
    </div>
  );
}
