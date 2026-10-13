import { redirect } from "next/navigation";
import { PageTitle } from "@/components/ui";
import { requireOfficer } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPersonnelManagement } from "@/lib/roles";
import { formatDuration } from "@/lib/utils";
import HrSectionNav from "./hr-section-nav";
import PersonnelRoster from "./personnel-roster";

export default async function HRPage() {
  const me = await requireOfficer();
  if (!hasPersonnelManagement(me.role, me.rank)) redirect("/mdt");

  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [officers, logs] = await Promise.all([
    db.officer.findMany({
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
        salaryPerHour: true,
      },
      orderBy: [{ active: "desc" }, { onDuty: "desc" }, { role: "desc" }, { badge: "asc" }],
    }),
    db.dutyLog.findMany({ where: { clockIn: { gte: since } } }),
  ]);

  const now = Date.now();
  const hoursMsByOfficer: Record<string, number> = {};
  for (const log of logs) {
    const end = log.clockOut ? log.clockOut.getTime() : now;
    hoursMsByOfficer[log.officerId] = (hoursMsByOfficer[log.officerId] ?? 0) + (end - log.clockIn.getTime());
  }
  const hoursByOfficer = Object.fromEntries(
    Object.entries(hoursMsByOfficer).map(([officerId, duration]) => [officerId, formatDuration(duration)]),
  );

  return (
    <div className="space-y-5">
      <PageTitle
        tag="PERSONNEL MANAGEMENT"
        sub="Danh sách hồ sơ, trạng thái công tác và quản lý tài khoản nhân viên."
      >
        Quản lý nhân sự
      </PageTitle>
      <HrSectionNav active="personnel" />
      <PersonnelRoster officers={officers} hoursByOfficer={hoursByOfficer} currentOfficerId={me.id} />
    </div>
  );
}
