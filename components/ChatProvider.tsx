"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type Ctx = { open: boolean; setOpen: (v: boolean) => void };
const ChatCtx = createContext<Ctx>({ open: false, setOpen: () => {} });

export function ChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <ChatCtx.Provider value={{ open, setOpen }}>{children}</ChatCtx.Provider>;
}

export const useChat = () => useContext(ChatCtx);
