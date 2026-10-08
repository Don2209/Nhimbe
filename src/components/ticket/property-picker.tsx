"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type PickerOption = { value: string; label: string; render?: React.ReactNode };

/** A compact dropdown that shows the current value and edits it in place. */
export function PropertyPicker({
  label,
  value,
  options,
  onChange,
  disabled,
  className,
  align = "start",
}: {
  label: string;
  value: string;
  options: PickerOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  align?: "start" | "end";
}) {
  const current = options.find((o) => o.value === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        aria-label={`${label}: ${current?.label ?? "none"}. Change ${label.toLowerCase()}`}
        render={
          <button
            type="button"
            className={cn(
              "group inline-flex h-8 max-w-full items-center gap-1.5 rounded-md px-1.5 text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 aria-expanded:bg-muted",
              className,
            )}
          />
        }
      >
        <span className="min-w-0 truncate">{current?.render ?? current?.label}</span>
        <ChevronDown
          className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-aria-expanded:opacity-100"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={value} onValueChange={(v) => v !== value && onChange(String(v))}>
            {options.map((o) => (
              <DropdownMenuRadioItem key={o.value} value={o.value} closeOnClick>
                {o.render ?? o.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
