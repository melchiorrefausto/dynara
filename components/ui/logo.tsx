import { cn } from "@/lib/utils";

export function DynaraLogo({ className, markOnly = false }: { className?: string; markOnly?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        width="34"
        height="34"
        viewBox="0 0 290 290"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="dynara-mark-gradient" x1="0" y1="0" x2="290" y2="290" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
        </defs>
        <path
          d="M144.751 11C218.619 11.0003 278.501 70.8828 278.501 144.751C278.501 218.619 218.619 278.501 144.751 278.501H11V11H144.751Z"
          stroke="url(#dynara-mark-gradient)"
          strokeWidth="22"
        />
        <path
          d="M144.75 64.2415C189.214 64.2415 225.259 100.286 225.259 144.75C225.259 189.214 189.214 225.259 144.75 225.259H64.2412V64.2415H144.75Z"
          stroke="url(#dynara-mark-gradient)"
          strokeWidth="22"
        />
        <path
          d="M144.75 114.883C161.245 114.883 174.618 128.255 174.618 144.75C174.618 161.246 161.245 174.618 144.75 174.618H114.883V114.883H144.75Z"
          stroke="url(#dynara-mark-gradient)"
          strokeWidth="22"
        />
      </svg>
      {!markOnly ? <span className="text-2xl font-bold tracking-normal">Dynara</span> : null}
    </div>
  );
}
