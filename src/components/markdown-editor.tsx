"use client";

import { useState } from "react";
import { Markdown } from "@/components/markdown";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Textarea with a Write / Preview toggle. */
export function MarkdownEditor({
  className,
  defaultValue = "",
  onValueChange,
  ...props
}: Omit<React.ComponentProps<"textarea">, "defaultValue"> & {
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const [tab, setTab] = useState<"write" | "preview">("write");

  return (
    <div className={cn("overflow-hidden rounded-lg border border-input bg-card focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50", className)}>
      <div role="tablist" aria-label="Editor mode" className="flex gap-1 border-b bg-muted/40 px-2 py-1">
        {(["write", "preview"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
              tab === t && "bg-card text-foreground shadow-sm",
            )}
          >
            {t}
          </button>
        ))}
        <span className="ml-auto self-center text-2xs text-muted-foreground">Markdown supported</span>
      </div>
      <Textarea
        {...props}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onValueChange?.(e.target.value);
        }}
        hidden={tab !== "write"}
        className="min-h-32 resize-y rounded-none border-0 bg-transparent font-mono text-[0.8125rem] leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
      {tab === "preview" && (
        <div className="min-h-32 px-3 py-2">
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
