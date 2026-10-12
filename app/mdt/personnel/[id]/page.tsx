import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarClock, FileText, Radio, ShieldCheck, UserRound } from "lucide-react";
import { Badge, Card, Empty, PageTitle } from "@/components/ui";
import { requireOfficer, roleLabel } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPersonnelManagement } from "@/lib/roles";
import { dutyHoursInPeriod, fmtDate, formatDuration } from "@/lib/utils";

export default async function PersonnelRecord({ params }: { params: { id: string } }) {
  const me = await requireOfficer();
  if (!hasPersonnelManagement(me.role, me.rank)) redirect("/mdt");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [officer, monthDutyLogs] = await Promise.all([
    db.officer.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        fullName: true,
        username: true,
        rank: true,
        badge: true,
        callsign: true,
        role: true,
        active: true,
        onDuty: true,
        createdAt: true,
        dutyLogs: {
          orderBy: { clockIn: "desc" },
          take: 20,
          select: { id: true, clockIn: true, clockOut: true, callsign: true },
        },
        incidents: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, number: true, title: true, createdAt: true, suspectName: true },
        },
        _count: { select: { dutyLogs: true, incidents: true, bolos: true, warrants: true } },
      },
    }),
    db.dutyLog.findMany({
      where: {
        officerId: params.id,
        clockIn: { lt: now },
        OR: [{ clockOut: null }, { clockOut: { gt: monthStart } }],
      },
      select: { clockIn: true, clockOut: true },
    }),
  ]);
  if (!officer) notFound();

  const dutyHours = dutyHoursInPeriod(monthDutyLogs, monthStart, now);
  const initials = officer.fullName.split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase();

  return (
    <div className="space-y-6">
      <Link href="/mdt/personnel" className="inline-flex items-center gap-2 text-xs text-slate-400 transition hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" /> Quay lại CSDL nhân viên
      </Link>

      <PageTitle tag={`EMPLOYEE RECORD · #${officer.badge}`} sub={`Thành viên từ ${fmtDate(officer.createdAt)}`}>
        Hồ sơ nhân viên
      </PageTitle>

      <Card className="p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-lg font-semibold text-sky-200">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold tracking-tight text-white">{officer.fullName}</h2>
            <p className="mt-1 font-mono text-xs text-slate-400">{officer.rank} · Badge #{officer.badge}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={officer.active ? "ok" : "danger"}>{officer.active ? "Active account" : "Inactive account"}</Badge>
              {officer.onDuty ? <Badge tone="ok" dot>10-8 · On-Duty</Badge> : <Badge tone="neutral">10-7 · Off-Duty</Badge>}
              <Badge tone="info">{roleLabel(officer.role)}</Badge>
            </div>
          </div>
          <Link href="/mdt/hr" className="btn text-xs">
            <ShieldCheck className="h-4 w-4" /> Chỉnh sửa nhân sự
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Thông tin công tác" icon={<UserRound className="h-4 w-4" />}>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Tài khoản</dt><dd className="text-right text-slate-200">@{officer.username}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Callsign</dt><dd className="text-right font-mono text-slate-200">{officer.callsign ?? "Chưa đặt"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Tham gia</dt><dd className="text-right text-slate-200">{fmtDate(officer.createdAt)}</dd></div>
          </dl>
        </Card>
        <Card title="Hoạt động tháng này" icon={<CalendarClock className="h-4 w-4" />}>
          <p className="font-mono text-2xl font-semibold text-sky-300">{dutyHours.toFixed(1)}h</p>
          <p className="mt-1 text-xs text-slate-500">Giờ trực đã ghi nhận từ đầu tháng</p>
          <p className="mt-3 border-t border-line pt-3 text-xs text-slate-400">{officer._count.dutyLogs} ca trực tổng cộng</p>
        </Card>
        <Card title="Hồ sơ hệ thống" icon={<FileText className="h-4 w-4" />}>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Báo cáo</dt><dd className="font-mono text-slate-200">{officer._count.incidents}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">BOLO đã tạo</dt><dd className="font-mono text-slate-200">{officer._count.bolos}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Warrant đã tạo</dt><dd className="font-mono text-slate-200">{officer._count.warrants}</dd></div>
          </dl>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Lịch sử ca trực gần đây" icon={<Radio className="h-4 w-4" />}>
          {officer.dutyLogs.length === 0 ? (
            <Empty>Chưa ghi nhận ca trực nào.</Empty>
          ) : (
            <div className="divide-y divide-line/60">
              {officer.dutyLogs.map((log) => (
                <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-xs font-medium text-slate-200">{log.callsign || officer.callsign || `#${officer.badge}`}</p>
                    <p className="mt-1 text-[11px] text-slate-500">Bắt đầu {fmtDate(log.clockIn)} · {log.clockOut ? `Kết thúc ${fmtDate(log.clockOut)}` : "Đang trực"}</p>
                  </div>
                  <Badge tone={log.clockOut ? "neutral" : "ok"}>{log.clockOut ? formatDuration(log.clockOut.getTime() - log.clockIn.getTime()) : "Active"}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Báo cáo gần đây" icon={<FileText className="h-4 w-4" />}>
          {officer.incidents.length === 0 ? (
            <Empty>Chưa có báo cáo nào do nhân viên này tạo.</Empty>
          ) : (
            <div className="divide-y divide-line/60">
              {officer.incidents.map((incident) => (
                <div key={incident.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-200">{incident.title}</p>
                    <span className="shrink-0 font-mono text-xs text-sky-300">#{incident.number}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{fmtDate(incident.createdAt)} · {incident.suspectName || "Chưa ghi tên đối tượng"}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
