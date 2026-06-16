"use client";
import { Command } from "cmdk";
import { useEffect, useState } from "react";
import { useChat } from "@/components/ChatProvider";
import { useTheme } from "@/components/ThemeProvider";

const EMAIL = "vineethkodakandla@gmail.com";
const GITHUB = "https://github.com/vineethkodakandla";
const LINKEDIN = "https://www.linkedin.com/in/vineethkodakandla";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { setOpen: setChatOpen } = useChat();
  const { toggle: toggleTheme } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const run = (fn: () => void) => {
    fn();
    setOpen(false);
  };
  const go = (hash: string) =>
    run(() => document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" }));
  const openUrl = (url: string) => run(() => window.open(url, "_blank", "noopener"));

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      className="cmdk-dialog"
    >
      <Command.Input placeholder="Type a command or search…" className="cmdk-input" />
      <Command.List className="cmdk-list">
        <Command.Empty className="cmdk-empty">No results.</Command.Empty>
        <Command.Group heading="Navigate" className="cmdk-group">
          <Command.Item onSelect={() => go("#work")}>Selected work</Command.Item>
          <Command.Item onSelect={() => go("#contact")}>Contact</Command.Item>
        </Command.Group>
        <Command.Group heading="Actions" className="cmdk-group">
          <Command.Item onSelect={() => run(() => setChatOpen(true))}>
            Ask the portfolio assistant
          </Command.Item>
          <Command.Item onSelect={() => run(toggleTheme)}>
            Toggle light / dark theme
          </Command.Item>
          <Command.Item onSelect={() => run(() => navigator.clipboard?.writeText(EMAIL))}>
            Copy email address
          </Command.Item>
        </Command.Group>
        <Command.Group heading="Links" className="cmdk-group">
          <Command.Item onSelect={() => openUrl(`mailto:${EMAIL}`)}>Email Vineeth</Command.Item>
          <Command.Item onSelect={() => openUrl(GITHUB)}>GitHub</Command.Item>
          <Command.Item onSelect={() => openUrl(LINKEDIN)}>LinkedIn</Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
