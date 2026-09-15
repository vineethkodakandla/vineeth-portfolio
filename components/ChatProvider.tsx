"use client";
import { createContext, useContext, useState, type ReactNode } from "react";

// `enabled` is decided on the server (the API key exists), so every entry point to
// the assistant (the launcher and the command palette) agrees on whether it exists.
type Ctx = { enabled: boolean; open: boolean; setOpen: (v: boolean) => void };
const ChatCtx = createContext<Ctx>({ enabled: false, open: false, setOpen: () => {} });

export function ChatProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <ChatCtx.Provider value={{ enabled, open, setOpen }}>{children}</ChatCtx.Provider>;
}

export const useChat = () => useContext(ChatCtx);
