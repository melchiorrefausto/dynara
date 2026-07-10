export function CubeCluster({ count }: { count: number }) {
  const cubes = Array.from({ length: count });
  return (
    <svg viewBox="0 0 90 90" className="h-20 w-20 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
      {cubes.map((_, index) => {
        const offset = index * 14;
        const x = 12 + (index % 2 === 0 ? 0 : 18) + offset * 0.35;
        const y = 60 - offset;
        return (
          <g key={index} transform={`translate(${x}, ${y})`}>
            <path d="M0 8 L14 0 L28 8 L14 16 Z" className="fill-cyan-100" />
            <path d="M0 8 L14 16 L14 30 L0 22 Z" className="fill-primary/70" />
            <path d="M28 8 L14 16 L14 30 L28 22 Z" className="fill-slate-950" />
          </g>
        );
      })}
    </svg>
  );
}
