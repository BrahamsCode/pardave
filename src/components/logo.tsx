import { cn } from "@/lib/utils";

/** Isotipo de la cruz bicolor (azul y menta) inspirada en la portada del catálogo. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={cn("h-9 w-9", className)}>
      <defs>
        <clipPath id="pdv-a">
          <path d="M0 0H38L36 6C26 18 22 30 12 42L10 48H0Z" />
        </clipPath>
        <clipPath id="pdv-b">
          <path d="M38 0H48V48H10L12 42C22 30 26 18 36 6Z" />
        </clipPath>
        <linearGradient id="pdv-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f8ef7" />
          <stop offset="1" stopColor="#1f57d6" />
        </linearGradient>
        <linearGradient id="pdv-mint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#72d6ad" />
          <stop offset="1" stopColor="#24a374" />
        </linearGradient>
      </defs>
      <g clipPath="url(#pdv-a)" fill="url(#pdv-blue)">
        <rect x="15" y="3" width="18" height="42" rx="7" />
        <rect x="3" y="15" width="42" height="18" rx="7" />
      </g>
      <g clipPath="url(#pdv-b)" fill="url(#pdv-mint)">
        <rect x="15" y="3" width="18" height="42" rx="7" />
        <rect x="3" y="15" width="42" height="18" rx="7" />
      </g>
      <path d="M37 5C26 18 22 30 11 43" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[1.05rem] font-extrabold tracking-tight",
            tone === "dark" ? "text-navy-900" : "text-white",
          )}
        >
          Inversiones Pardave
        </span>
        <span
          className={cn(
            "mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
            tone === "dark" ? "text-mint-600" : "text-mint-300",
          )}
        >
          Corp. Farma Perú
        </span>
      </span>
    </span>
  );
}
