import { cn } from "@/lib/utils";
import {
  Inbox,
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import React from "react";

// Re-export interactive client-only components from client-ui.tsx
export { Modal, Tabs } from "@/components/client-ui";

// ─────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────

const CARD_TONES = {
  default: "",
  danger:  "border-danger/35",
  warn:    "border-warn/30",
  neon:    "border-neon/25",
  police:  "border-police/40",
  ok:      "border-ok/30",
} as const;

type CardTone = keyof typeof CARD_TONES;

export function Card({
  title,
  icon,
  children,
  className,
  action,
  subtitle,
  tone = "default",
  id,
}: {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  subtitle?: string;
  tone?: CardTone;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "card scroll-mt-24",
        tone !== "default" && CARD_TONES[tone],
        className
      )}
    >
      {title && (
        <div className="card-title justify-between">
          <div className="flex items-center gap-2.5">
            {icon && (
              <span className="flex h-8 w-8 items-center justify-center rounded border border-line bg-white/[0.04] text-neon">
                {icon}
              </span>
            )}
            <div>
              <span className="font-semibold text-slate-100">{title}</span>
              {subtitle && (
                <p className="mt-0.5 font-sans text-xs font-normal leading-relaxed text-slate-500">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && (
            <div className="normal-case font-sans tracking-normal">{action}</div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// BUTTON
// ─────────────────────────────────────────────────────────────

const BTN_VARIANTS = {
  default: "btn",
  neon:    "btn btn-neon",
  danger:  "btn btn-danger",
  ok:      "btn btn-ok",
  gold:    "btn btn-gold",
  ghost:   "btn border-transparent bg-transparent hover:bg-white/[0.05] hover:border-line",
} as const;

const BTN_SIZES = {
  sm: "px-2.5 py-1.5 text-xs gap-1.5",
  md: "px-3.5 py-2 text-sm gap-2",
  lg: "px-4 py-2.5 text-sm gap-2",
} as const;

export function Button({
  variant = "default",
  size = "md",
  children,
  className,
  ...props
}: {
  variant?: keyof typeof BTN_VARIANTS;
  size?: keyof typeof BTN_SIZES;
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(BTN_VARIANTS[variant], BTN_SIZES[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────────────────────────

const BADGE_TONES = {
  neutral: "border-line/80 bg-slate-800/40 text-slate-300",
  info:    "border-police/40 bg-police/15 text-sky-200",
  ok:      "border-ok/40 bg-ok/10 text-emerald-300",
  warn:    "border-warn/40 bg-warn/10 text-amber-300",
  danger:  "border-danger/40 bg-danger/10 text-red-300",
  gold:    "border-gold/40 bg-gold/10 text-amber-300",
} as const;

const BADGE_DOTS = {
  neutral: "bg-slate-400",
  info:    "bg-sky-300",
  ok:      "bg-emerald-400",
  warn:    "bg-amber-400",
  danger:  "bg-red-400",
  gold:    "bg-amber-400",
} as const;

export function Badge({
  tone = "neutral",
  dot = false,
  children,
  className,
}: {
  tone?: keyof typeof BADGE_TONES;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("badge", BADGE_TONES[tone], className)}>
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", BADGE_DOTS[tone])}
        />
      )}
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// FIELD (form field wrapper)
// ─────────────────────────────────────────────────────────────

export function Field({
  label,
  children,
  required,
  hint,
  htmlFor,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
  htmlFor?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={htmlFor} className="label mb-0">
          {label}{" "}
          {required && <span className="text-danger" aria-hidden>*</span>}
          {required && <span className="sr-only">(bắt buộc)</span>}
        </label>
        {hint && (
          <span className="font-mono text-[10px] text-slate-500">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ALERT BANNER – for critical in-page alerts
// ─────────────────────────────────────────────────────────────

const ALERT_STYLES = {
  critical: {
    wrapper: "border-danger/60 bg-danger/10",
    icon:    "text-red-400",
    title:   "text-red-200",
    body:    "text-red-300/80",
    Icon:    AlertTriangle,
  },
  warn: {
    wrapper: "border-warn/50 bg-warn/10",
    icon:    "text-amber-400",
    title:   "text-amber-200",
    body:    "text-amber-300/80",
    Icon:    AlertCircle,
  },
  info: {
    wrapper: "border-neon/30 bg-neon/5",
    icon:    "text-neon",
    title:   "text-sky-100",
    body:    "text-slate-400",
    Icon:    Info,
  },
  ok: {
    wrapper: "border-ok/40 bg-ok/8",
    icon:    "text-emerald-400",
    title:   "text-emerald-200",
    body:    "text-emerald-300/80",
    Icon:    CheckCircle2,
  },
} as const;

export function AlertBanner({
  level = "info",
  title,
  children,
  className,
}: {
  level?: keyof typeof ALERT_STYLES;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const s = ALERT_STYLES[level];
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded border px-4 py-3",
        s.wrapper,
        className
      )}
    >
      <s.Icon className={cn("mt-0.5 h-4 w-4 shrink-0", s.icon)} aria-hidden />
      <div>
        <p className={cn("text-[13px] font-semibold", s.title)}>{title}</p>
        {children && (
          <p className={cn("mt-0.5 text-xs", s.body)}>{children}</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// THREAT BANNER – full-width, sticky, for WANTED / ARMED
// ─────────────────────────────────────────────────────────────

export function ThreatBanner({
  level,
  label,
  sub,
}: {
  level: "wanted" | "armed" | "caution";
  label: string;
  sub?: string;
}) {
  const styles = {
    wanted: "bg-danger/15 border-danger/60 text-red-200",
    armed:  "bg-danger/20 border-danger/80 text-red-100",
    caution:"bg-warn/10 border-warn/50 text-amber-200",
  };
  const icons = {
    wanted:  "⚠",
    armed:   "🔴",
    caution: "⚡",
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex items-center gap-3 border-b px-4 py-2.5 text-sm font-semibold tracking-wide",
        styles[level]
      )}
    >
      <span aria-hidden className="text-base leading-none">{icons[level]}</span>
      <span>{label}</span>
      {sub && (
        <span className="ml-auto font-normal opacity-70 text-xs">{sub}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────

export function Empty({
  icon,
  children,
  className,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center rounded border border-dashed border-line/60 bg-panel2/30 px-6 py-10 text-center",
        className
      )}
    >
      <span className="mb-2.5 text-slate-500">
        {icon ?? <Inbox className="h-7 w-7 stroke-[1.5]" />}
      </span>
      <p className="text-sm text-slate-400">{children}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SKELETON ROWS – for loading states
// ─────────────────────────────────────────────────────────────

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr aria-hidden>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="td">
          <div className="h-3.5 w-3/4 animate-pulse rounded bg-white/[0.06]" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonRows({ count = 3, cols }: { count?: number; cols?: number }) {
  return (
    <tbody aria-label="Đang tải dữ liệu..." aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </tbody>
  );
}

export function SkeletonBlock({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded bg-white/[0.06]", className)}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE TITLE
// ─────────────────────────────────────────────────────────────

export function PageTitle({
  children,
  sub,
  tag,
  action,
}: {
  children: React.ReactNode;
  sub?: string;
  tag?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {tag && <span className="mdt-eyebrow">{tag}</span>}
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-white sm:text-[28px]">
          {children}
        </h1>
        {sub && (
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-slate-400">
            {sub}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────

const STAT_TONES = {
  neon:   "text-neon border-neon/30 bg-neon/10",
  police: "text-sky-300 border-police/40 bg-police/15",
  danger: "text-red-400 border-danger/30 bg-danger/10",
  ok:     "text-emerald-400 border-ok/30 bg-ok/10",
  warn:   "text-amber-400 border-warn/30 bg-warn/10",
  gold:   "text-amber-300 border-gold/30 bg-gold/10",
} as const;

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "neon",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof STAT_TONES;
}) {
  return (
    <div className="card flex min-h-[108px] items-center justify-between border-t-2 border-t-police/60 p-4">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
          {label}
        </p>
        <p className="mt-2 font-mono text-[26px] font-semibold leading-none tracking-tight text-white">
          {value}
        </p>
        {sub && <p className="mt-1.5 text-[11px] text-slate-500">{sub}</p>}
      </div>
      {Icon && (
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded border",
            STAT_TONES[tone]
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LICENSE PLATE BADGE
// ─────────────────────────────────────────────────────────────

export function PlateBadge({
  plate,
  stolen,
}: {
  plate: string;
  stolen?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="license-plate">{plate}</span>
      {stolen && (
        <Badge tone="danger" dot>
          XE TRỘM
        </Badge>
      )}
    </span>
  );
}
