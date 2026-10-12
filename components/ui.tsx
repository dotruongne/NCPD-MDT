import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

export function Card({
  title,
  icon,
  children,
  className,
  action,
  subtitle,
  tone,
  id,
}: {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  subtitle?: string;
  tone?: "default" | "danger" | "warn" | "neon" | "police";
  id?: string;
}) {
  const toneBorders = {
    default: "",
    danger: "border-danger/30",
    warn: "border-warn/30",
    neon: "border-neon/30",
    police: "border-police/30",
  };

  return (
    <section id={id} className={cn("card scroll-mt-24", tone && toneBorders[tone], className)}>
      {title && (
        <div className="card-title justify-between">
          <div className="flex items-center gap-2.5">
            {icon && (
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-white/[0.035] text-sky-200">
                {icon}
              </span>
            )}
            <div>
              <span className="text-slate-100 font-semibold">{title}</span>
              {subtitle && <p className="mt-1 font-sans text-xs font-normal leading-relaxed text-slate-500">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="normal-case font-sans tracking-normal">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="label mb-0">
          {label} {required && <span className="text-danger">*</span>}
        </label>
        {hint && <span className="text-[10px] text-slate-500 font-mono">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const TONES = {
  neutral: "border-line/80 bg-slate-800/40 text-slate-300",
  info: "border-police/40 bg-police/10 text-sky-200",
  ok: "border-ok/40 bg-ok/10 text-emerald-300",
  warn: "border-warn/40 bg-warn/10 text-amber-300",
  danger: "border-danger/40 bg-danger/10 text-red-300",
  gold: "border-gold/40 bg-gold/10 text-amber-300",
};

const DOT_COLORS = {
  neutral: "bg-slate-400",
  info: "bg-sky-300",
  ok: "bg-emerald-400",
  warn: "bg-amber-400",
  danger: "bg-red-400",
  gold: "bg-amber-400",
};

export function Badge({
  tone = "neutral",
  dot = false,
  children,
  className,
}: {
  tone?: keyof typeof TONES;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("badge", TONES[tone], className)}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", DOT_COLORS[tone])} />}
      {children}
    </span>
  );
}

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
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-line/80 bg-panel2/30 px-6 py-8 text-center text-sm text-slate-400",
        className
      )}
    >
      <div className="mb-2 text-slate-500">
        {icon ?? <Inbox className="h-7 w-7 stroke-[1.5]" />}
      </div>
      <p>{children}</p>
    </div>
  );
}

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
        {tag && (
          <span className="mdt-eyebrow">
            {tag}
          </span>
        )}
        <h1 className="flex items-center gap-2 text-[26px] font-semibold tracking-[-0.025em] text-white sm:text-[30px]">
          {children}
        </h1>
        {sub && <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-slate-400">{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

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
  tone?: "neon" | "police" | "danger" | "ok" | "warn";
}) {
  const tones = {
    neon: "text-neon bg-neon/10 border-neon/30",
    police: "text-police bg-police/10 border-police/30",
    danger: "text-red-400 bg-danger/10 border-danger/30",
    ok: "text-emerald-400 bg-ok/10 border-ok/30",
    warn: "text-amber-400 bg-warn/10 border-warn/30",
  };

  return (
    <div className="card flex min-h-[112px] items-center justify-between border-t-2 border-t-police/70 p-4">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">{label}</p>
        <p className="mt-2 font-mono text-[26px] font-semibold leading-none tracking-tight text-white">{value}</p>
        {sub && <p className="mt-2 text-[11px] text-slate-500">{sub}</p>}
      </div>
      {Icon && (
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-md border", tones[tone])}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      )}
    </div>
  );
}

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
