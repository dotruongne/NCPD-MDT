import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Search, ShieldCheck, Users } from "lucide-react";
import { Badge, Card, Empty, PageTitle } from "@/components/ui";
import { requireOfficer, roleLabel } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPersonnelManagement } from "@/lib/roles";

const statusFilter = (value?: string) => {
  if (value === "active") return { active: true };
  if (value === "inactive") return { active: false };
  if (value === "on-duty") return { active: true, onDuty: true };
  return {};
};

export default async function PersonnelDirectory({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const me = await requireOfficer();
  if (!hasPersonnelManagement(me.role, me.rank)) redirect("/mdt");

  const q = searchParams.q?.trim() ?? "";
  const status = searchParams.status ?? "all";
  const officers = await db.officer.findMany({
    where: {
      ...statusFilter(status),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" as const } },
              { username: { contains: q, mode: "insensitive" as const } },
              { badge: { contains: q, mode: "insensitive" as const } },
              { callsign: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
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
      _count: { select: { incidents: true, dutyLogs: true } },
    },
    orderBy: [{ active: "desc" }, { onDuty: "desc" }, { rank: "asc" }, { fullName: "asc" }],
  });
  const activeCount = officers.filter((officer) => officer.active).length;
  const onDutyCount = officers.filter((officer) => officer.onDuty).length;

  return (
    <div className="space-y-6">
      <PageTitle
        tag="PERSONNEL DATABASE"
        sub="Hồ sơ nội bộ sĩ quan, trạng thái công tác và lịch sử hoạt động."
        action={
          <Link href="/mdt/hr" className="btn btn-neon text-xs">
            <ShieldCheck className="h-4 w-4" /> Quản lý nhân sự
          </Link>
        }
      >
        Cơ sở dữ liệu nhân viên
      </PageTitle>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4" title="Hồ sơ hiển thị" icon={<Users className="h-4 w-4" />}>
          <p className="font-mono text-2xl font-semibold text-white">{officers.length}</p>
          <p className="mt-1 text-xs text-slate-500">Theo điều kiện lọc hiện tại</p>
        </Card>
        <Card className="p-4" title="Active" icon={<ShieldCheck className="h-4 w-4" />}>
          <p className="font-mono text-2xl font-semibold text-emerald-300">{activeCount}</p>
          <p className="mt-1 text-xs text-slate-500">Nhân sự có thể đăng nhập MDT</p>
        </Card>
        <Card className="p-4" title="On-Duty" icon={<Users className="h-4 w-4" />}>
          <p className="font-mono text-2xl font-semibold text-sky-300">{onDutyCount}</p>
          <p className="mt-1 text-xs text-slate-500">Đang trong ca trực</p>
        </Card>
      </div>

      <Card
        title="Danh sách sĩ quan"
        icon={<Users className="h-4 w-4" />}
        subtitle="Chọn hồ sơ để xem chi tiết cấp bậc, liên lạc và hoạt động gần đây."
      >
        <form className="mb-4 flex flex-col gap-2 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              name="q"
              defaultValue={q}
              className="input pl-9"
              placeholder="Tìm tên, tài khoản, badge hoặc callsign..."
            />
          </label>
          <select name="status" defaultValue={status} className="input sm:w-48">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Active</option>
            <option value="on-duty">On-Duty</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="btn btn-neon">Tìm hồ sơ</button>
        </form>

        {officers.length === 0 ? (
          <Empty>Không tìm thấy hồ sơ nhân viên phù hợp.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr>
                  <th className="th">Nhân viên</th>
                  <th className="th">Cấp bậc</th>
                  <th className="th">Phân hệ</th>
                  <th className="th">Hoạt động</th>
                  <th className="th">Trạng thái</th>
                  <th className="th text-right">Hồ sơ</th>
                </tr>
              </thead>
              <tbody>
                {officers.map((officer) => (
                  <tr key={officer.id} className="border-b border-line/50 transition hover:bg-white/[0.025]">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-700/50 text-xs font-bold text-slate-200">
                          {officer.fullName.split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-white">{officer.fullName}</span>
                          <span className="mt-0.5 block font-mono text-[10px] text-slate-500">
                            @{officer.username} · #{officer.badge}{officer.callsign ? ` · ${officer.callsign}` : ""}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="td text-slate-300">{officer.rank}</td>
                    <td className="td text-xs text-slate-400">{roleLabel(officer.role)}</td>
                    <td className="td text-xs text-slate-400">
                      {officer._count.incidents} reports · {officer._count.dutyLogs} shifts
                    </td>
                    <td className="td">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone={officer.active ? "ok" : "neutral"}>{officer.active ? "Active" : "Inactive"}</Badge>
                        {officer.onDuty && <Badge tone="info" dot>On-Duty</Badge>}
                      </div>
                    </td>
                    <td className="td text-right">
                      <Link href={`/mdt/personnel/${officer.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-sky-300 hover:text-sky-200">
                        Mở hồ sơ <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
