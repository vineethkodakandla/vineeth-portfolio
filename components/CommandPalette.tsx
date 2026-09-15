"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// Ctrl/Cmd+K. Only this key listener loads with every page; the dialog and its
// dependencies (cmdk, Radix) load the first time the palette is opened.
const PaletteDialog = dynamic(() => import("@/components/CommandPaletteDialog"), { ssr: false });

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setLoaded(true);
        setOpen((wasOpen) => {
          if (!wasOpen) returnFocus.current = document.activeElement as HTMLElement | null;
          return !wasOpen;
        });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return loaded ? <PaletteDialog open={open} onOpenChange={setOpen} returnFocus={returnFocus} /> : null;
}
