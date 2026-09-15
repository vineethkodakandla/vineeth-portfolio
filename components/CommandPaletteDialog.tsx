"use client";
import { Command } from "cmdk";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type RefObject } from "react";
import { useChat } from "@/components/ChatProvider";
import { scrollToHash } from "@/components/SectionLink";
import { useTheme } from "@/components/ThemeProvider";

const EMAIL = "vineethkodakandla@gmail.com";
const GITHUB = "https://github.com/vineethkodakandla";
const LINKEDIN = "https://www.linkedin.com/in/vineethkodakandla";

export default function CommandPaletteDialog({
  open,
  onOpenChange,
  returnFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: RefObject<HTMLElement | null>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { enabled: chatEnabled, setOpen: setChatOpen } = useChat();
  const { toggle: toggleTheme } = useTheme();
  const restoreFocus = useRef(true);
  const wasOpen = useRef(open);

  // cmdk's dialog has no trigger element, so Radix drops focus on <body> when it
  // closes. Put focus back where it was, unless the chosen action moved it.
  useEffect(() => {
    if (wasOpen.current && !open) {
      if (restoreFocus.current) {
        const el = returnFocus.current;
        setTimeout(() => {
          if (el?.isConnected && (!document.activeElement || document.activeElement === document.body)) {
            el.focus({ preventScroll: true });
          }
        }, 0);
      }
      restoreFocus.current = true;
    }
    wasOpen.current = open;
  }, [open, returnFocus]);

  const close = (restore: boolean) => {
    restoreFocus.current = restore;
    onOpenChange(false);
  };
  const run = (fn: () => void, restore = true) => {
    close(restore);
    fn();
  };
  const go = (href: string) => {
    close(false);
    if (pathname === "/" && href.startsWith("/#")) {
      requestAnimationFrame(() => scrollToHash(href));
      return;
    }
    router.push(href);
  };

  return (
    <Command.Dialog open={open} onOpenChange={onOpenChange} label="Command palette" className="cmdk-dialog">
      <Command.Input placeholder="Jump to a page or action" className="cmdk-input" />
      <Command.List className="cmdk-list">
        <Command.Empty className="cmdk-empty">No results.</Command.Empty>
        <Command.Group heading="Case studies" className="cmdk-group">
          <Command.Item onSelect={() => go("/work/bitwise-forensics")}>bitwise-forensics</Command.Item>
          <Command.Item onSelect={() => go("/work/meteor-lake-latency-lab")}>Meteor Lake Latency Lab</Command.Item>
          <Command.Item onSelect={() => go("/work/llm-eval-observatory")}>LLM Eval Observatory</Command.Item>
        </Command.Group>
        <Command.Group heading="Sections" className="cmdk-group">
          <Command.Item onSelect={() => go("/#work")}>Selected work</Command.Item>
          <Command.Item onSelect={() => go("/#experience")}>Experience</Command.Item>
          <Command.Item onSelect={() => go("/#contact")}>Contact</Command.Item>
        </Command.Group>
        <Command.Group heading="Actions" className="cmdk-group">
          {chatEnabled ? (
            <Command.Item onSelect={() => run(() => setChatOpen(true), false)}>Ask the assistant</Command.Item>
          ) : null}
          <Command.Item onSelect={() => run(toggleTheme)}>Change color theme</Command.Item>
          <Command.Item onSelect={() => run(() => navigator.clipboard?.writeText(EMAIL))}>Copy email address</Command.Item>
        </Command.Group>
        <Command.Group heading="Elsewhere" className="cmdk-group">
          <Command.Item onSelect={() => run(() => window.open(GITHUB, "_blank", "noopener"), false)}>GitHub</Command.Item>
          <Command.Item onSelect={() => run(() => window.open(LINKEDIN, "_blank", "noopener"), false)}>LinkedIn</Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
