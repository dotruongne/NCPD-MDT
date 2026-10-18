import Link from "next/link";
import {
  Megaphone,
  Power,
  Radio,
  Scale,
  Crosshair,
  Shield,
  Siren,
  AlertTriangle,
  Pin,
  FileText,
  WalletCards,
  ArrowUpRight,
  CalendarDays,
  Plus,
  Search,
  Activity,
  Car,
  Clock,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireOfficer, roleLabel } from "@/lib/auth";
import { Badge, Card, Empty, PageTitle, PlateBadge, StatCard, ThreatBanner } from "@/components/ui";
import { dutyHoursInPeriod, fmtDate, money } from "@/lib/utils";
import { SOP } from "@/lib/codes";
import { deleteAnnouncement, postAnnouncement, toggleDuty } from "./actions";

export default async function Dashboard() {
  const me = await requireOfficer();
  const now = new Date();
  const recentSince = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [
    announcements,
    bolos,
    onDutyList,
    activeBoloCount,
    activeWarrants,
    recentIncidents,
    myDutyLogs,
    activeCallCount,
    pendingCalls,
  ] = await Promise.all([
    db.announcement.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 6,
      include: { author: { select: { fullName: true, rank: true } } },
    }),
    db.bolo.findMany({ where: { active: true }, orderBy: { createdAt: "desc" }, take: 4 }),
    db.officer.findMany({
      where: { onDuty: true },
      select: { id: true, fullName: true, callsign: true, rank: true, badge: true },
      orderBy: { rank: "asc" },
    }),
    db.bolo.count({ where: { active: true } }),
    db.warrant.count({ where: { status: "ACTIVE" } }),
    db.incident.count({ where: { createdAt: { gte: recentSince } } }),
    db.dutyLog.findMany({
      where: {
        officerId: me.id,
        clockIn: { lt: now },
        OR: [{ clockOut: null }, { clockOut: { gt: monthStart } }],
      },
      select: { clockIn: true, clockOut: true },
    }),
    db.dispatchCall.count({ where: { status: { in: ["PENDING", "DISPATCHED", "ON_SCENE"] } } }),
    db.dispatchCall.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const monthHours = dutyHoursInPeriod(myDutyLogs, monthStart, now);
  const monthPay = Math.round(monthHours * me.salaryPerHour);
  const canPost = me.role !== "OFFICER";

  return (
    <div className="mdt-dashboard space-y-5">
      {/* 1. Tactical Command Center Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-neon">
              NOVARIS CITY POLICE DEPARTMENT
            </span>
            <span className="text-slate-600">/</span>
            <span className="font-mono text-[10px] text-slate-400">TACTICAL DISPATCH HQ</span>
          </div>
          <h1 className="mt-1 font-mono text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
            Trung Tâm Chỉ Huy Tác Chiến
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Giám sát nguồn lực, tiếp nhận cảnh báo khẩn cấp và cập nhật chỉ lệnh ca trực.
          </p>
        </div>

        {/* Quick Launchpad & Shift Status */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/mdt/reports/new"
            className="btn btn-neon text-xs font-mono font-bold px-3.5 py-2 shadow-neon flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> LẬP BÁO CÁO ÁN
          </Link>
          <Link
            href="/mdt/database"
            className="btn text-xs font-mono px-3 py-2 flex items-center gap-1.5"
          >
            <Search className="h-3.5 w-3.5 text-neon" /> TRA CỨU CSDL
          </Link>
          <div className="hidden sm:inline-flex items-center gap-2 border border-line bg-panel2/60 px-3 py-2 text-xs font-mono text-slate-300 rounded">
            <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
            {now.toLocaleDateString("vi-VN", {
              weekday: "short",
              day: "numeric",
              month: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* 2. Urgent Live Incident Alert Feed (If any pending 911 calls exist) */}
      {pendingCalls.length > 0 && (
        <ThreatBanner
          level="caution"
          label={`TÍN HIỆU 911 CHƯA TIẾP NHẬN: CÓ ${pendingCalls.length} CUỘC GỌI CẦN ĐIỀU PHỐI TUẦN TRA`}
          sub="ĐIỀU PHỐI VIÊN HOẶC SĨ QUAN TẠI HIỆN TRƯỜNG CẦN NHẬN TÍN HIỆU NGAY"
        />
      )}

      {/* 3. Operational Telemetry Metrics (5 stats) */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Tình hình đơn vị">
        <StatCard
          label="Sĩ quan đang trực"
          value={onDutyList.length}
          sub="Đơn vị sẵn sàng tác chiến"
          icon={Radio}
          tone="ok"
        />
        <Link href="/mdt/dispatch" className="block transition hover:-translate-y-0.5">
          <StatCard
            label="Cuộc gọi đang mở"
            value={activeCallCount}
            sub="Chờ xử lý / Đang phản hồi"
            icon={Siren}
            tone={activeCallCount > 0 ? "danger" : "police"}
          />
        </Link>
        <Link href="/mdt/ops" className="block transition hover:-translate-y-0.5">
          <StatCard
            label="BOLO hiệu lực"
            value={activeBoloCount}
            sub="Cảnh báo đối tượng & xe"
            icon={Crosshair}
            tone={activeBoloCount > 0 ? "warn" : "police"}
          />
        </Link>
        <Link href="/mdt/ops" className="block transition hover:-translate-y-0.5">
          <StatCard
            label="Lệnh truy nã"
            value={activeWarrants}
            sub="Chưa thi hành án"
            icon={Shield}
            tone={activeWarrants > 0 ? "danger" : "police"}
          />
        </Link>
        <Link href="/mdt/reports" className="block transition hover:-translate-y-0.5">
          <StatCard
            label="Báo cáo 7 ngày"
            value={recentIncidents}
            sub="Hồ sơ vụ án đã ghi nhận"
            icon={FileText}
            tone="police"
          />
        </Link>
      </section>

      {/* 4. Shift & Payroll Telemetry */}
      <Card
        title="Hồ sơ ca trực & Thu nhập cá nhân"
        icon={<WalletCards className="h-4 w-4" />}
        subtitle={`Tạm tính theo chấm công On-Duty · Tháng ${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Tổng giờ trực trong tháng
            </p>
            <p className="mt-1 font-mono text-2xl font-black text-white">{monthHours.toFixed(1)}h</p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Hạn mức lương / Giờ (Rank)
            </p>
            <p className="mt-1 font-mono text-2xl font-black text-white">{money(me.salaryPerHour)}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Thu nhập tạm tính
            </p>
            <p className="mt-1 font-mono text-2xl font-black text-neon">{money(monthPay)}</p>
          </div>
        </div>
      </Card>

      {/* 5. Main Operational Split (1 Col Duty & BOLO / 2 Cols Announcements & Dispatch) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Duty Switch & Active Patrol Units */}
        <div className="space-y-5 lg:col-span-1">
          {/* Duty Control Card */}
          <Card
            id="duty"
            title="Trạng thái ca trực của tôi"
            icon={<Power className="h-4 w-4" />}
          >
            <div className="duty-summary flex items-center justify-between rounded border border-line bg-panel2/60 p-3 mb-3.5">
              <div>
                <p className="font-semibold text-white text-sm font-mono">{me.fullName}</p>
                <p className="font-mono text-[11px] text-slate-400">
                  {me.rank} · #{me.badge}
                </p>
              </div>
              <Badge tone={me.onDuty ? "ok" : "neutral"} dot={me.onDuty}>
                {me.onDuty ? `ON-DUTY (${me.callsign ?? "10-8"})` : "OFF-DUTY (10-7)"}
              </Badge>
            </div>

            <form action={toggleDuty} className="space-y-3">
              {!me.onDuty && (
                <div>
                  <label className="label">Mã hiệu tuần tra (Callsign)</label>
                  <input
                    name="callsign"
                    defaultValue={me.callsign ?? ""}
                    placeholder="VD: 1-ADAM-12, LINCOLN-4, MARY-2..."
                    className="input font-mono uppercase text-xs"
                    required
                  />
                  <p className="mt-1 font-mono text-[10px] text-slate-500">
                    ADAM (Xe đôi) · LINCOLN (Xe đơn) · MARY (Mô tô) · AIR (Trực thăng)
                  </p>
                </div>
              )}
              <button
                className={
                  me.onDuty
                    ? "btn btn-danger w-full py-2.5 font-mono font-bold text-xs"
                    : "btn btn-ok w-full py-2.5 font-mono font-bold text-xs shadow-ok"
                }
              >
                {me.onDuty ? `KẾT THÚC CA (10-7 · OFF-DUTY)` : "BẮT ĐẦU CA TRỰC (10-8 · ON-DUTY)"}
              </button>
            </form>
          </Card>

          {/* On-Duty Units Patrol Roster */}
          <Card
            title={`Đơn vị tuần tra sẵn sàng (${onDutyList.length})`}
            icon={<Radio className="h-4 w-4" />}
            subtitle="Các đơn vị hiện đang kết nối radio và tuần tra"
          >
            {onDutyList.length === 0 ? (
              <Empty>Hiện chưa có sĩ quan nào On-Duty.</Empty>
            ) : (
              <ul className="space-y-2">
                {onDutyList.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between rounded border border-line bg-panel2/50 p-2.5 text-xs transition hover:border-slate-500"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <div>
                        <span className="font-semibold text-white font-mono">{u.fullName}</span>
                        <span className="ml-1 text-[11px] text-slate-400">({u.rank})</span>
                      </div>
                    </div>
                    <span className="rounded bg-neon/15 border border-neon/30 px-2 py-0.5 font-mono text-[11px] font-bold text-neon">
                      {u.callsign ?? `#${u.badge}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Active BOLOs Widget */}
          <Card
            title="Cảnh báo BOLO hiệu lực"
            icon={<Crosshair className="h-4 w-4" />}
            subtitle="Lệnh theo dõi và truy bắt phương tiện/đối tượng"
            tone={bolos.length > 0 ? "warn" : "default"}
          >
            {bolos.length === 0 ? (
              <Empty>Không có thông báo BOLO nào đang có hiệu lực.</Empty>
            ) : (
              <ul className="space-y-2.5">
                {bolos.map((b) => (
                  <li
                    key={b.id}
                    className="rounded border border-warn/40 bg-warn/10 p-3 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <Badge tone="warn" dot>{b.kind}</Badge>
                      {b.plate && <PlateBadge plate={b.plate} />}
                    </div>
                    <p className="font-semibold text-slate-200">{b.description}</p>
                    {b.lastSeen && (
                      <p className="text-[11px] text-amber-300 font-mono">
                        📍 Thấy lần cuối: {b.lastSeen}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right 2 Columns: Directive Bulletins & Force SOP */}
        <div className="space-y-5 lg:col-span-2">
          {/* Directive Announcements */}
          <Card
            id="announcements"
            title="Chỉ thị & Thông báo từ Ban Chỉ Huy Đồn"
            icon={<Megaphone className="h-4 w-4" />}
          >
            <div className="space-y-3">
              {announcements.length === 0 && (
                <Empty>Hiện chưa có thông báo chỉ đạo nào từ Ban Chỉ Huy.</Empty>
              )}
              {announcements.map((a) => (
                <article
                  key={a.id}
                  className={`rounded border p-4 transition ${
                    a.pinned
                      ? "border-amber-500/50 bg-amber-500/5 shadow-gold"
                      : "border-line bg-panel2/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {a.pinned && (
                        <span className="flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                          <Pin className="h-3 w-3" /> GHIM
                        </span>
                      )}
                      <h3 className="font-bold text-white text-base">{a.title}</h3>
                    </div>
                    {canPost && (
                      <form action={deleteAnnouncement}>
                        <input type="hidden" name="id" value={a.id} />
                        <button className="text-xs font-mono text-slate-500 hover:text-danger transition">
                          [Xóa]
                        </button>
                      </form>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-xs text-slate-300 leading-relaxed font-sans">
                    {a.body}
                  </p>
                  <p className="mt-3 font-mono text-[11px] text-slate-500 border-t border-line/40 pt-2 flex items-center gap-2">
                    <span className="text-neon font-semibold">
                      {a.author.rank} {a.author.fullName}
                    </span>
                    <span>·</span>
                    <span>{fmtDate(a.createdAt)}</span>
                  </p>
                </article>
              ))}
            </div>

            {/* Post Directive Form (Supervisor+) */}
            {canPost && (
              <form
                action={postAnnouncement}
                className="mt-6 space-y-3 border-t border-line/70 pt-5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-neon">
                    + Ban hành thông báo chỉ đạo mới (Cấp bậc Supervisor+)
                  </span>
                </div>
                <input
                  name="title"
                  placeholder="Tiêu đề thông báo..."
                  className="input text-xs"
                  required
                />
                <textarea
                  name="body"
                  placeholder="Nội dung chỉ đạo gửi toàn bộ sĩ quan trong ca trực..."
                  rows={3}
                  className="input text-xs"
                  required
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-400 font-mono cursor-pointer">
                    <input type="checkbox" name="pinned" className="rounded" /> Ghim lên đầu bảng tin
                  </label>
                  <button className="btn btn-neon text-xs font-mono font-bold px-4 py-2">
                    Ban hành thông báo
                  </button>
                </div>
              </form>
            )}
          </Card>

          {/* Standard Operating Procedures (SOP) Force Matrix */}
          <Card
            title="Quy chế sử dụng vũ lực cảnh sát (SOP Matrix)"
            icon={<Scale className="h-4 w-4" />}
            subtitle="Tuân thủ nghiêm ngặt bậc thang vũ lực theo điều lệ NCPD"
          >
            <ul className="space-y-2 text-xs">
              {SOP.map((r, idx) => {
                const badgeTones = [
                  "info",
                  "warn",
                  "danger",
                  "danger",
                  "neutral",
                ] as const;
                return (
                  <li
                    key={r.level}
                    className="rounded border border-line bg-panel2/40 p-2.5"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-bold text-white font-mono">{r.level}</span>
                      <Badge tone={badgeTones[idx] ?? "neutral"}>
                        {idx < 4 ? `Cấp độ ${idx + 1}` : "Quy tắc"}
                      </Badge>
                    </div>
                    <p className="text-slate-400 font-sans leading-relaxed">{r.text}</p>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
