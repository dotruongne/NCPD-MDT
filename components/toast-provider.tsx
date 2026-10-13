"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { BadgeCheck, CircleAlert, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

type ToastInput = {
  type: ToastType;
  message: string;
  title?: string;
};

type ToastItem = ToastInput & { id: number };
type ToastContextValue = { showToast: (toast: ToastInput) => void };

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_DURATION = 4600;

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}

export function ToastOnChange({
  eventKey,
  message,
  type,
  title,
}: {
  eventKey: unknown;
  message?: string | null;
  type: ToastType;
  title?: string;
}) {
  const { showToast } = useToast();
  const lastEvent = useRef<unknown>(null);

  useEffect(() => {
    if (!message || eventKey == null || eventKey === lastEvent.current) return;
    lastEvent.current = eventKey;
    showToast({ type, message, title });
  }, [eventKey, message, showToast, title, type]);

  return null;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const recentMessages = useRef(new Map<string, number>());

  const dismiss = useCallback((id: number) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((toast: ToastInput) => {
    const now = Date.now();
    const key = `${toast.type}:${toast.message}`;
    const lastShown = recentMessages.current.get(key) ?? 0;
    if (now - lastShown < 900) return;
    recentMessages.current.set(key, now);

    const id = now + Math.random();
    setToasts((items) => [...items.slice(-2), { ...toast, id }]);
  }, []);

  useEffect(() => {
    const cleanup = window.setInterval(() => {
      const cutoff = Date.now() - TOAST_DURATION;
      recentMessages.current.forEach((shownAt, key) => {
        if (shownAt < cutoff) recentMessages.current.delete(key);
      });
    }, TOAST_DURATION);
    return () => window.clearInterval(cleanup);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-stack" aria-label="Thông báo hệ thống">
        {toasts.map((toast) => {
          const Icon = toast.type === "success" ? BadgeCheck : toast.type === "error" ? CircleAlert : Info;
          return (
            <div
              key={toast.id}
              className={`app-toast app-toast-${toast.type}`}
              role={toast.type === "error" ? "alert" : "status"}
              aria-live={toast.type === "error" ? "assertive" : "polite"}
            >
              <span className="app-toast-icon"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <span className="app-toast-copy">
                {toast.title && <strong>{toast.title}</strong>}
                <span>{toast.message}</span>
              </span>
              <button
                type="button"
                className="app-toast-close"
                onClick={() => dismiss(toast.id)}
                aria-label="Đóng thông báo"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="app-toast-progress" style={{ animationDuration: `${TOAST_DURATION}ms` }} aria-hidden="true" />
            </div>
          );
        })}
      </div>
      {toasts.map((toast) => (
        <ToastExpiry key={`expiry-${toast.id}`} toast={toast} dismiss={dismiss} />
      ))}
    </ToastContext.Provider>
  );
}

function ToastExpiry({ toast, dismiss }: { toast: ToastItem; dismiss: (id: number) => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(() => dismiss(toast.id), TOAST_DURATION);
    return () => window.clearTimeout(timeout);
  }, [dismiss, toast.id]);
  return null;
}