import Link from "next/link";
import { Megaphone, Power, Radio, Scale, Crosshair, Shield, Siren, AlertTriangle, Pin, FileText, WalletCards, ArrowUpRight, CalendarDays } from "lucide-react";
import { db } from "@/lib/db";
import { requireOfficer, roleLabel } from "@/lib/auth";
import { Badge, Card, Empty, PageTitle, PlateBadge, StatCard } from "@/components/ui";
import { dutyHoursInPeriod, fmtDate, money } from "@/lib/utils";
import { SOP } from "@/lib/codes";
import { deleteAnnouncement, postAnnouncement, toggleDuty } from "./actions";

export default async function Dashboard() {
  const me = await requireOfficer();
  const now = new Date();
  const recentSince = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [announcements, bolos, onDutyList, activeBoloCount, activeWarrants, recentIncidents, myDutyLogs, activeCallCount] = await Promise.all([
    db.announcement.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 8,
      include: { author: { select: { fullName: true, rank: true } } },
    }),
    db.bolo.findMany({ where: { active: true }, orderBy: { createdAt: "desc" }, take: 5 }),
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
  ]);
  const monthHours = dutyHoursInPeriod(myDutyLogs, monthStart, now);
  const monthPay = Math.round(monthHours * me.salaryPerHour);
  const canPost = me.role !== "OFFICER";

  return (
    <div className="mdt-dashboard space-y-5">
      <section className="dashboard-heading flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="dashboard-eyebrow mb-2 text-[10px] font-bold uppercase tracking-[0.14em]">NCPD Novaris City <span className="mx-1 opacity-50">/</span> Trung tâm điều hành</p>
          <h1 className="dashboard-title text-2xl font-bold tracking-tight sm:text-[30px]">Bảng điều khiển</h1>
          <p className="dashboard-copy mt-2 text-[13px]">Tình hình hoạt động, nguồn lực và thông tin trong ca trực hiện tại.</p>
        </div>
        <div className="dashboard-date inline-flex items-center gap-2 border border-line px-3 py-2 text-xs">
          <CalendarDays className="h-4 w-4 text-slate-500" />
          {now.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Tình hình đơn vị">
        <StatCard label="Sĩ quan đang trực" value={onDutyList.length} sub="Đơn vị sẵn sàng" icon={Radio} tone="ok" />
        <Link href="/mdt/dispatch" className="block transition hover:-translate-y-0.5">
          <StatCard label="Cuộc gọi đang mở" value={activeCallCount} sub="Chờ xử lý / đang phản hồi" icon={Siren} tone="danger" />
        </Link>
        <Link href="/mdt/ops" className="block transition hover:-translate-y-0.5">
          <StatCard label="BOLO hiệu lực" value={activeBoloCount} sub="Cảnh báo tác chiến" icon={AlertTriangle} tone="warn" />
        </Link>
        <Link href="/mdt/ops" className="block transition hover:-translate-y-0.5">
          <StatCard label="Lệnh truy nã" value={activeWarrants} sub="Chưa thi hành" icon={Shield} tone="danger" />
        </Link>
        <Link href="/mdt/reports" className="block transition hover:-translate-y-0.5">
          <StatCard label="Báo cáo gần đây" value={recentIncidents} sub="Trong 7 ngày qua" icon={FileText} tone="police" />
        </Link>
      </section>

      <Card
        title="Hồ sơ ca trực & thu nhập"
        icon={<WalletCards className="h-4 w-4" />}
        subtitle={`Tạm tính từ chấm công On-Duty · Tháng ${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Giờ trực tháng này</p>
            <p className="mt-1 font-mono text-xl font-semibold text-white">{monthHours.toFixed(1)}h</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Mức lương mỗi giờ</p>
            <p className="mt-1 font-mono text-xl font-semibold text-white">{money(me.salaryPerHour)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Thu nhập ước tính</p>
            <p className="mt-1 font-mono text-xl font-semibold text-sky-300">{money(monthPay)}</p>
          </div>
        </div>
        <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-slate-500">
          Tạm tính từ giờ trực đã ghi nhận × mức lương do Ban Chỉ huy thiết lập; chưa bao gồm thưởng, khấu trừ hoặc điều chỉnh thủ công.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Duty & Patrol & BOLOs */}
        <div className="space-y-6 lg:col-span-1">
          {/* Duty Switch Card */}
          <Card
            id="duty"
            title="Ca trực của tôi"
            icon={<Power className="h-4 w-4" />}
            tone={me.onDuty ? "default" : "default"}
          >
            <div className="duty-summary flex items-center justify-between rounded-lg border border-line p-3 mb-4">
              <div>
                <p className="font-semibold text-white text-sm">{me.fullName}</p>
                <p className="font-mono text-xs text-slate-400">{me.rank} · #{me.badge}</p>
              </div>
              <Badge tone={me.onDuty ? "ok" : "neutral"} dot={me.onDuty}>
                {me.onDuty ? `ON-DUTY (${me.callsign})` : "OFF-DUTY"}
              </Badge>
            </div>

            <form action={toggleDuty} className="space-y-3">
              {!me.onDuty && (
                <div>
                  <label className="label">Mã hiệu tuần tra (Callsign)</label>
                  <input
                    name="callsign"
                    defaultValue={me.callsign ?? ""}
                    placeholder="VD: ADAM-12, LINCOLN-1..."
                    className="input font-mono uppercase"
                    required
                  />
                  <p className="mt-1 font-mono text-[10px] text-slate-500">
                    Gợi ý: ADAM (xe 2 người), LINCOLN (xe 1 người), MARY (mô tô)
                  </p>
                </div>
              )}
              <button
                className={
                  me.onDuty
                    ? "btn btn-danger w-full py-2.5 font-semibold"
                    : "btn btn-ok w-full py-2.5 font-semibold"
                }
              >
                {me.onDuty ? `10-7 · END SHIFT (${me.callsign})` : "10-8 · START SHIFT"}
              </button>
            </form>
          </Card>

          {/* Active Units */}
          <Card
            title={`Đơn vị đang trực (${onDutyList.length})`}
            icon={<Radio className="h-4 w-4" />}
            subtitle="Các sĩ quan hiện đang kết nối radio và tuần tra"
          >
            {onDutyList.length === 0 ? (
              <Empty>Hiện chưa có sĩ quan nào On-Duty.</Empty>
            ) : (
              <ul className="space-y-2">
                {onDutyList.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between rounded-lg border border-line/60 bg-panel2/50 p-2.5 text-xs transition hover:border-neon/30"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <div>
                        <span className="font-semibold text-white">{u.fullName}</span>
                        <span className="ml-1 text-[11px] text-slate-400">({u.rank})</span>
                      </div>
                    </div>
                    <span className="rounded bg-neon/15 border border-neon/30 px-2 py-0.5 font-mono text-[11px] font-bold text-neon">
                      {u.callsign}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Active BOLOs */}
          <Card
            title="BOLO đang hiệu lực"
            icon={<Crosshair className="h-4 w-4" />}
            subtitle="Thông báo truy nã nóng và xe bị theo dõi"
            tone={bolos.length > 0 ? "danger" : "default"}
          >
            {bolos.length === 0 ? (
              <Empty>Không có BOLO nào đang có hiệu lực.</Empty>
            ) : (
              <ul className="space-y-3">
                {bolos.map((b) => (
                  <li
                    key={b.id}
                    className="rounded-lg border border-danger/40 bg-danger/10 p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <Badge tone="danger" dot>{b.kind}</Badge>
                      {b.plate && <PlateBadge plate={b.plate} />}
                    </div>
                    <p className="text-sm font-medium text-slate-200">{b.description}</p>
                    {b.lastSeen && (
                      <p className="text-xs text-amber-300 font-mono">
                        📍 Thấy lần cuối: {b.lastSeen}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right 2 Columns: Announcements, SOP & Codes */}
        <div className="space-y-6 lg:col-span-2">
          {/* Announcements */}
          <Card
            id="announcements"
            title="Chỉ thị & Thông báo từ Ban Chỉ Huy"
            icon={<Megaphone className="h-4 w-4" />}
          >
            <div className="space-y-3">
              {announcements.length === 0 && (
                <Empty>Hiện chưa có thông báo nào từ Ban Chỉ Huy.</Empty>
              )}
              {announcements.map((a) => (
                <article
                  key={a.id}
                  className={`rounded-xl border p-4 transition ${
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
                      <h3 className="font-semibold text-white text-base">{a.title}</h3>
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
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">
                    {a.body}
                  </p>
                  <p className="mt-3 font-mono text-[11px] text-slate-500 border-t border-line/40 pt-2 flex items-center gap-2">
                    <span className="text-neon">{a.author.rank} {a.author.fullName}</span>
                    <span>·</span>
                    <span>{fmtDate(a.createdAt)}</span>
                  </p>
                </article>
              ))}
            </div>

            {canPost && (
              <form
                action={postAnnouncement}
                className="mt-6 space-y-3 border-t border-line pt-5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-neon">
                    + Phát thông báo mới (Supervisor+)
                  </span>
                </div>
                <input
                  name="title"
                  placeholder="Tiêu đề thông báo..."
                  className="input"
                  required
                />
                <textarea
                  name="body"
                  placeholder="Nội dung thông báo chỉ đạo cho toàn đơn vị..."
                  rows={3}
                  className="input"
                  required
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-400 font-mono cursor-pointer">
                    <input type="checkbox" name="pinned" className="rounded" /> Ghim lên đầu bảng tin
                  </label>
                  <button className="btn btn-neon text-xs font-semibold px-4">
                    Đăng thông báo
                  </button>
                </div>
              </form>
            )}
          </Card>

          <Card
            title="Quy định nổ súng (SOP)"
            icon={<Scale className="h-4 w-4" />}
            subtitle="Cấp bậc bậc thang sử dụng vũ lực"
          >
            <ul className="space-y-2.5 text-xs">
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
                    className="rounded-lg border border-line/60 bg-panel2/40 p-2.5"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-semibold text-white">{r.level}</span>
                      <Badge tone={badgeTones[idx] ?? "neutral"}>
                        {idx < 4 ? `Bậc ${idx + 1}` : "Ghi nhớ"}
                      </Badge>
                    </div>
                    <p className="text-slate-400">{r.text}</p>
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
