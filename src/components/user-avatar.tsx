import { cn } from "@/lib/utils";

// Earthy hues that keep white initials legible in both themes.
const HUES = ["#2f5d46", "#9e4a2a", "#6a4f9a", "#8a6414", "#2f6577", "#7a4b5c", "#4f6b2f"];

function hueFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return HUES[h % HUES.length];
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function UserAvatar({
  user,
  className,
}: {
  user: { id: string; name: string } | null;
  className?: string;
}) {
  if (!user) {
    return (
      <span
        className={cn(
          "inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/50",
          className,
        )}
        title="Unassigned"
      >
        <span className="sr-only">Unassigned</span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[0.625rem] font-semibold text-white",
        className,
      )}
      style={{ backgroundColor: hueFor(user.id) }}
      title={user.name}
      aria-hidden="true"
    >
      {initials(user.name)}
    </span>
  );
}
