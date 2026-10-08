"use client";

import { useRouter } from "next/navigation";
import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";
import { CommandPalette } from "@/components/command-palette";

type Shortcuts = { openPalette: () => void };

const ShortcutsContext = createContext<Shortcuts>({ openPalette: () => {} });

export const useShortcuts = () => use(ShortcutsContext);

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
    target.closest("[role=dialog],[role=menu],[role=listbox]") !== null
  );
}

/** Global keyboard shortcuts: Ctrl/Cmd+K opens the palette, "C" creates a ticket. */
export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (
        e.key.toLowerCase() === "c" &&
        !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey &&
        !e.defaultPrevented &&
        !isTyping(e.target)
      ) {
        e.preventDefault();
        router.push("/tickets/new");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  const openPalette = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ openPalette }), [openPalette]);

  return (
    <ShortcutsContext value={value}>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </ShortcutsContext>
  );
}
