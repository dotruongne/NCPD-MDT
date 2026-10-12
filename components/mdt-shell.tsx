"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Database,
  FileText,
  Radio,
  Users,
  Search,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Car,
  Archive,
  User,
  Shield,
  Clock,
  Sparkles,
  Bell,
  Siren,
  ChevronDown,
  Activity,
  CircleDollarSign,
  GraduationCap,
  BadgeAlert,
  ScrollText,
  CalendarDays,
  TrafficCone,
  KeyRound,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { hasFinanceAccess, hasFtoAccess, hasPersonnelManagement } from "@/lib/roles";

type Props = {
  officer: {
    fullName: string;
    rank: string;
    badge: string;
    callsign: string | null;
    onDuty: boolean;
    role: string;
  };
  logoutAction: () => Promise<void>;
  toggleDutyAction: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
};

const TABS = [
  { group: "Tổng quan", href: "/mdt", label: "Bảng điều khiển", detail: "Dashboard", icon: LayoutDashboard },
  { group: "Tra cứu", href: "/mdt/database", label: "Hồ sơ công dân", detail: "Citizen records", icon: Database },
  { group: "Tra cứu", href: "/mdt/database?tab=vehicles", label: "Phương tiện", detail: "Vehicle registry", icon: Car },
  { group: "Tra cứu", href: "/mdt/database?tab=evidence", label: "Kho bằng chứng", detail: "Evidence records", icon: Archive },
  { group: "Tác chiến", href: "/mdt/reports", label: "Báo cáo vụ việc", detail: "Incident reports", icon: FileText },
  { group: "Tác chiến", href: "/mdt/dispatch", label: "Điều phối cuộc gọi", detail: "Dispatch", icon: Radio },
  { group: "Tác chiến", href: "/mdt/ops", label: "BOLO & Truy nã", detail: "Operational alerts", icon: Siren },
  { group: "Tác chiến", href: "/mdt/traffic", label: "Phạt & tạm giữ xe", detail: "Traffic enforcement", icon: TrafficCone },
  { group: "Nhân sự", href: "/mdt/leave", label: "Xin nghỉ phép", detail: "Leave of absence", icon: CalendarDays },
  { group: "Phòng ban", href: "/mdt/departments/finance", label: "Phòng Tài chính", detail: "Sổ quỹ & lương", icon: CircleDollarSign, finance: true },
  { group: "Phòng ban", href: "/mdt/departments/fto", label: "Phòng Huấn luyện FTO", detail: "Học viện & đào tạo", icon: GraduationCap, fto: true },
  { group: "Phòng ban", href: "/mdt/departments/fto/certificates", label: "Chứng chỉ sĩ quan", detail: "FTO certifications", icon: Award, fto: true },
  { group: "Quản trị", href: "/mdt/personnel", label: "CSDL nhân viên", detail: "Personnel records", icon: Users, personnel: true },
  { group: "Quản trị", href: "/mdt/hr", label: "Quản lý nhân sự", detail: "Personnel management", icon: Shield, personnel: true },
  { group: "Quản trị", href: "/mdt/internal-affairs", label: "Nội vụ (IA)", detail: "Hồ sơ khiếu nại & kỷ luật", icon: BadgeAlert, personnel: true },
  { group: "Quản trị", href: "/mdt/audit", label: "Nhật ký thao tác", detail: "Audit log", icon: ScrollText, personnel: true },
  { group: "Tài khoản", href: "/mdt/settings", label: "Bảo mật tài khoản", detail: "Password & sessions", icon: KeyRound },
];

export function MdtShell({ officer, logoutAction, toggleDutyAction, children }: Props) {
  const path = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      setCompact(localStorage.getItem("mdt_compact") === "1");
    } catch {}
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleCompact = () => {
    setCompact((c) => {
      try {
        localStorage.setItem("mdt_compact", c ? "0" : "1");
      } catch {}
      return !c;
    });
  };

  const tabs = TABS.filter((t) =>
    (!t.personnel || hasPersonnelManagement(officer.role, officer.rank)) &&
    (!t.finance || hasFinanceAccess(officer.role, officer.rank)) &&
    (!t.fto || hasFtoAccess(officer.role, officer.rank))
  );
  const groups = [...new Set(tabs.map((tab) => tab.group))];
  const profileInitials = officer.fullName
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="mdt-app min-h-screen bg-bg text-slate-200">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "mdt-sidebar sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line transition-[width] duration-200 md:flex",
            compact ? "w-[72px]" : "w-[252px]"
          )}
        >
          <Link href="/mdt" className={cn("mdt-wordmark flex h-[82px] items-center gap-3 border-b border-line border-t-4 border-t-[#a84242] px-5", compact && "justify-center px-2")}>
            <span className="mdt-brand-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-500/50 text-sky-200">
              <Shield className="h-[19px] w-[19px]" />
            </span>
            {!compact && (
              <span className="min-w-0">
                <span className="block text-[12px] font-bold tracking-[0.04em] text-white">NOVARIS POLICE DEPARTMENT</span>
                <span className="mt-1 block text-[9px] font-medium tracking-[0.12em] text-slate-400">MOBILE DATA TERMINAL</span>
              </span>
            )}
          </Link>

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5" aria-label="Điều hướng chính">
            {groups.map((group) => (
              <div key={group}>
                {!compact && (
                  <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    {group}
                  </p>
                )}
                <div className="space-y-1">
                  {tabs.filter((tab) => tab.group === group).map(({ href, label, detail, icon: Icon }) => {
                    const targetPath = href.split("?")[0];
                    const active = targetPath === "/mdt"
                      ? path === targetPath
                      : targetPath === "/mdt/database"
                      ? path.startsWith(targetPath) &&
                        (href.includes("tab=vehicles")
                          ? searchParams.get("tab") === "vehicles"
                          : href.includes("tab=evidence")
                          ? searchParams.get("tab") === "evidence"
                          : !["vehicles", "evidence"].includes(searchParams.get("tab") ?? ""))
                      : path.startsWith(targetPath);
                    return (
                      <Link
                        key={href}
                        href={href}
                        title={compact ? `${label} · ${detail}` : undefined}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "mdt-nav-link group flex min-h-10 items-center gap-3 rounded-md border-l-2 border-transparent px-3 text-[13px] font-medium transition-colors",
                          compact && "justify-center px-0",
                          active
                              ? "mdt-nav-active border-l-[#a84242] text-white"
                              : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
                        )}
                      >
                        <Icon className={cn("h-[17px] w-[17px] shrink-0", active ? "text-sky-200" : "text-slate-500 group-hover:text-slate-300")} />
                        {!compact && <span>{label}</span>}
                        {!compact && active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className={cn("border-t border-line/80 p-3", compact && "px-2")}>
            <div className={cn("mdt-profile-card flex items-center gap-3 rounded-md border border-line/70 p-2.5", compact && "justify-center px-1")}>
              <span className="mdt-profile-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-xs font-bold text-slate-200">
                {profileInitials}
              </span>
              {!compact && (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-slate-100">{officer.fullName}</span>
                  <span className="mt-0.5 block truncate font-mono text-[10px] text-slate-500">{officer.rank} · #{officer.badge}</span>
                </span>
              )}
              {!compact && <Activity className={cn("h-3.5 w-3.5", officer.onDuty ? "text-emerald-400" : "text-slate-600")} />}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mdt-header sticky top-0 z-40 border-b border-line">
            <div className="mdt-agency-bar flex min-h-[36px] items-center justify-between border-b border-line px-4 md:px-7">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-sky-700" />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em]">Novaris City</span>
                <span className="hidden text-[10px] text-slate-500 sm:inline">· NCPD · Mạng nội bộ</span>
              </div>
              <span className="hidden text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:inline">Hệ thống quản lý và điều phối nghiệp vụ</span>
            </div>
            <div className="flex min-h-[68px] items-center justify-between gap-3 px-4 md:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={toggleCompact}
                  className="hidden h-9 w-9 items-center justify-center rounded-md border border-line text-slate-400 transition hover:bg-white/[0.04] hover:text-white md:flex"
                  title={compact ? "Expand navigation" : "Collapse navigation"}
                  aria-label={compact ? "Expand navigation" : "Collapse navigation"}
                >
                  {compact ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {officer.fullName}
                    <span className="ml-2 hidden font-mono text-[11px] font-normal text-slate-500 sm:inline">
                      {officer.rank} · {officer.callsign || `#${officer.badge}`}
                    </span>
                  </p>
                  <form action={toggleDutyAction}>
                    <input type="hidden" name="callsign" value={officer.callsign ?? officer.badge} />
                    <button
                      className={cn(
                        "mt-0.5 inline-flex items-center gap-1.5 rounded-sm font-mono text-[10px] uppercase tracking-wider transition hover:brightness-110",
                        officer.onDuty ? "text-emerald-300" : "text-slate-500"
                      )}
                      title={officer.onDuty ? "End shift (10-7)" : "Start shift (10-8)"}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", officer.onDuty ? "bg-emerald-400" : "bg-slate-600")} />
                      {officer.onDuty ? "10-8 · ĐANG TRỰC" : "10-7 · NGOÀI CA"}
                    </button>
                  </form>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {time && (
                  <div className="hidden items-center gap-2 border-r border-line pr-4 font-mono text-xs text-slate-300 lg:flex">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>{time}</span>
                    <span className="text-slate-600">GIỜ ĐỊA PHƯƠNG</span>
                  </div>
                )}
                <button
                  onClick={() => setOpen(true)}
                  className="flex h-9 items-center gap-2 rounded-md border border-line bg-white/[0.025] px-3 text-xs text-slate-400 transition hover:border-slate-500 hover:text-white"
                  title="Quick search (Ctrl + K)"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Tra cứu</span>
                  <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-slate-500 lg:inline">Ctrl K</kbd>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen((value) => !value)}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
                    title="Thông báo đơn vị"
                    aria-label="Thông báo đơn vị"
                    aria-expanded={notificationsOpen}
                  >
                    <Bell className="h-4 w-4" />
                  </button>
                  {notificationsOpen && (
                    <div className="absolute right-0 top-11 z-50 w-64 rounded-md border border-line bg-panel p-4 shadow-2xl">
                      <p className="border-b border-line pb-2 text-xs font-semibold text-white">Thông báo đơn vị</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">Xem chỉ thị và thông báo mới nhất từ Ban Chỉ huy.</p>
                      <Link href="/mdt#announcements" onClick={() => setNotificationsOpen(false)} className="mt-3 inline-flex text-xs font-medium text-sky-300 hover:text-sky-200">
                        Mở bảng thông báo
                      </Link>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  disabled
                  title="Chức năng báo động khẩn cấp chưa được kết nối"
                  className="mdt-emergency flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold disabled:cursor-not-allowed"
                >
                  <Siren className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">KHẨN CẤP</span>
                </button>
                <ThemeToggle compact />
                <details className="relative md:hidden">
                  <summary className="flex h-9 cursor-pointer list-none items-center gap-1 rounded-md border border-line px-2 text-xs text-slate-300">
                    <Shield className="h-4 w-4 text-sky-300" />
                    <ChevronDown className="h-3 w-3" />
                  </summary>
                  <nav className="absolute right-0 top-11 z-50 w-56 rounded-md border border-line bg-panel p-2 shadow-2xl" aria-label="Điều hướng">
                    {tabs.map(({ href, label, icon: Icon }) => (
                      <Link key={href} href={href} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-xs text-slate-300 hover:bg-white/[0.05]">
                        <Icon className="h-4 w-4 text-slate-500" />
                        {label}
                      </Link>
                    ))}
                  </nav>
                </details>
                <form action={logoutAction}>
                  <button className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-slate-500 transition hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-300" title="Đăng xuất" aria-label="Đăng xuất">
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </header>

          <main className={cn("mdt-main mx-auto min-h-[calc(100vh-106px)] max-w-[1600px] transition-all", compact ? "p-4 md:p-5" : "p-4 md:p-7")}>
            {children}
          </main>
        </div>
      </div>

      {open && (
        <SearchPalette
          onClose={() => setOpen(false)}
          go={(href) => {
            setOpen(false);
            router.push(href);
          }}
        />
      )}
    </div>
  );
}

type SearchData = {
  citizens: { id: string; fullName: string; citizenId: string; tags: string[] }[];
  vehicles: {
    id: string;
    plate: string;
    model: string;
    color: string;
    stolen: boolean;
    owner: { id: string; fullName: string } | null;
  }[];
};

function SearchPalette({
  onClose,
  go,
}: {
  onClose: () => void;
  go: (href: string) => void;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "citizens" | "vehicles">("all");
  const [data, setData] = useState<SearchData>({ citizens: [], vehicles: [] });
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => ref.current?.focus(), []);

  useEffect(() => {
    if (q.trim().length < 2) {
      setData({ citizens: [], vehicles: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { citizens: [], vehicles: [] }))
        .then((res) => {
          setData(res);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const showCitizens = filter === "all" || filter === "citizens";
  const showVehicles = filter === "all" || filter === "vehicles";

  const totalResults =
    (showCitizens ? data.citizens.length : 0) + (showVehicles ? data.vehicles.length : 0);
  const none = !loading && q.trim().length >= 2 && totalResults === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 pt-[10vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-2xl border-neon/50 bg-panel shadow-neon p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input bar */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5 bg-panel2/50">
          <Search className="h-5 w-5 text-neon" />
          <input
            ref={ref}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tra cứu nhanh Tên IC, Căn cước, SĐT hoặc Biển số xe..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
          />
          {loading && (
            <div className="h-4 w-4 rounded-full border-2 border-neon border-t-transparent animate-spin" />
          )}
          <kbd className="hidden sm:inline rounded bg-panel border border-line px-2 py-0.5 font-mono text-[10px] text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-line/40 bg-panel/50 text-xs">
          <span className="font-mono text-[10px] uppercase text-slate-500 mr-2">Bộ lọc:</span>
          {(["all", "citizens", "vehicles"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded px-2.5 py-1 font-mono text-[11px] transition",
                filter === f
                  ? "bg-neon/15 text-neon border border-neon/30 font-semibold"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {f === "all" ? "Tất cả" : f === "citizens" ? "Công dân" : "Phương tiện"}
            </button>
          ))}
        </div>

        {/* Results area */}
        <div className="max-h-96 space-y-1.5 overflow-y-auto p-3">
          {showCitizens &&
            data.citizens.map((c) => (
              <button
                key={c.id}
                onClick={() => go(`/mdt/database/citizens/${c.id}`)}
                className="group flex w-full items-center gap-3 rounded-lg border border-transparent p-2.5 text-left transition hover:border-line hover:bg-panel2"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel2 text-neon group-hover:border-neon">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white group-hover:text-neon transition">
                    {c.fullName}
                  </p>
                  <p className="font-mono text-xs text-slate-400">CCCD: {c.citizenId}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {c.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="badge border-danger/50 bg-danger/10 text-red-300 text-[10px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </button>
            ))}

          {showVehicles &&
            data.vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() =>
                  go(
                    v.owner
                      ? `/mdt/database/citizens/${v.owner.id}`
                      : `/mdt/database?tab=vehicles&q=${v.plate}`
                  )
                }
                className="group flex w-full items-center gap-3 rounded-lg border border-transparent p-2.5 text-left transition hover:border-line hover:bg-panel2"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel2 text-warn group-hover:border-warn">
                  <Car className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="license-plate text-xs py-0 px-2">{v.plate}</span>
                    <span className="text-xs text-slate-300">
                      {v.model} · {v.color}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Chủ sở hữu: {v.owner?.fullName ?? "Chưa đăng ký"}
                  </p>
                </div>
                {v.stolen && (
                  <span className="badge border-danger/50 bg-danger/10 text-red-300 text-[10px]">
                    XE TRỘM
                  </span>
                )}
              </button>
            ))}

          {none && (
            <div className="py-8 text-center text-sm text-slate-500">
              Không tìm thấy hồ sơ hoặc phương tiện khớp với từ khóa "{q}".
            </div>
          )}

          {!q && (
            <div className="py-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
              <Sparkles className="h-5 w-5 text-neon/60" />
              <span>Gõ ít nhất 2 ký tự để tìm kiếm hồ sơ trong cơ sở dữ liệu.</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-line/60 bg-panel2/40 px-4 py-2 text-right font-mono text-[10px] text-slate-500">
          NCPD Central Database Query System
        </div>
      </div>
    </div>
  );
}
