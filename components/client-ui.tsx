"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  width = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg";
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus trap: move focus to close button when opened
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: "max-w-sm", md: "max-w-xl", lg: "max-w-3xl" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full rounded border border-line bg-panel shadow-2xl animate-slide-up",
          widths[width]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2
            id="modal-title"
            className="text-sm font-semibold tracking-wide text-white"
          >
            {title}
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-7 w-7 items-center justify-center rounded text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector<HTMLButtonElement>(`[data-tab-id="${active}"]`);
    if (activeEl) {
      setPillStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
    }
  }, [active, tabs]);

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex = -1;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }
    if (nextIndex >= 0) {
      e.preventDefault();
      const nextTab = tabs[nextIndex];
      if (nextTab) onChange(nextTab.id);
    }
  };

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label="Tabs"
      className={cn(
        "relative flex items-center p-1 rounded-lg border border-[#253648] bg-[#091220]/80 backdrop-blur-sm select-none",
        className
      )}
    >
      {/* Lucian UX/UI #039 Sliding Pill Indicator */}
      <span
        className="absolute top-1 bottom-1 rounded-md bg-gradient-to-r from-sky-500/20 to-sky-400/20 border border-sky-400/40 shadow-[0_0_12px_rgba(56,189,248,0.25)] transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] pointer-events-none"
        style={{
          left: `${pillStyle.left}px`,
          width: `${pillStyle.width}px`,
        }}
        aria-hidden="true"
      />

      {tabs.map((tab, idx) => {
        const isSelected = active === tab.id;
        return (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              "relative z-10 flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs font-mono font-semibold tracking-wider rounded-md transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400",
              isSelected
                ? "text-white font-bold"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "rounded px-1.5 py-0.2 font-mono text-[10px] transition-colors",
                  isSelected
                    ? "bg-sky-400/30 text-sky-200 border border-sky-400/40"
                    : "bg-white/[0.05] text-slate-500"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
