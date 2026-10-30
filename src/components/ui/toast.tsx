"use client";

import { X } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface ToastMessage {
  id: number;
  title: string;
  description?: string;
}

interface ToastContextValue {
  notify: (message: Omit<ToastMessage, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Bottom-right, 4 s toasts (prototype: Toast · success | error). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const notify = useCallback((message: Omit<ToastMessage, "id">) => {
    setMessages((current) => [
      ...current.slice(-2),
      { ...message, id: Date.now() + Math.random() },
    ]);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4000} label="Bildirim">
        {children}
        {messages.map((m) => (
          <ToastPrimitive.Root
            key={m.id}
            onOpenChange={(open) => {
              if (!open) setMessages((current) => current.filter((x) => x.id !== m.id));
            }}
            className="flex items-start gap-3 rounded-lg bg-primary py-2.5 pr-2 pl-3.5 text-fg-inverse shadow-popover data-[state=open]:animate-fade-in"
          >
            <div className="min-w-0 flex-1">
              <ToastPrimitive.Title className="text-label font-medium">
                {m.title}
              </ToastPrimitive.Title>
              {m.description ? (
                <ToastPrimitive.Description className="mt-0.5 text-caption text-white/70">
                  {m.description}
                </ToastPrimitive.Description>
              ) : null}
            </div>
            <ToastPrimitive.Close
              aria-label="Kapat"
              className="flex size-6 shrink-0 items-center justify-center rounded-sm text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X className="size-3.5" aria-hidden="true" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed right-4 bottom-4 z-[60] flex w-[min(360px,calc(100vw-32px))] flex-col gap-2 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
