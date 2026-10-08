import { cn } from "@/lib/utils";

/** Three figures gathered in a ring: the nhimbe work party. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-7 shrink-0", className)}
    >
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <g className="fill-primary-foreground">
        <circle cx="16" cy="9.5" r="2.6" />
        <circle cx="9.6" cy="19.5" r="2.6" />
        <circle cx="22.4" cy="19.5" r="2.6" />
      </g>
      <circle
        cx="16"
        cy="16.5"
        r="9.2"
        fill="none"
        strokeWidth="1.6"
        strokeDasharray="4 3.2"
        className="stroke-primary-foreground/45"
      />
      <circle cx="16" cy="16.5" r="1.8" className="fill-terracotta" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-heading text-lg font-semibold tracking-tight">
        Nhimbe
      </span>
    </span>
  );
}
