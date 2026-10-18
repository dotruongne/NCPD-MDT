import Link from "next/link";
import { ArrowUpRight, ClipboardList, FileText, MapPin, Paperclip, Search, ShieldCheck, UserRound } from "lucide-react";
import { Badge, Card, Empty, PageTitle } from "@/components/ui";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { updateIncidentCase } from "../actions";

const STATUSES = ["OPEN", "INVESTIGATING", "CLOSED"] as const;
type CaseStatus = (typeof STATUSES)[number];

const statusLabels: Record<CaseStatus, string> = {
  OPEN: "Mới tiếp nhận",
  INVESTIGATING: "Đang điều tra",
  CLOSED: "Đã khép hồ sơ",
};

const statusTones: Record<CaseStatus, "danger" | "warn" | "ok"> = {
  OPEN: "danger",
  INVESTIGATING: "warn",
  CLOSED: "ok",
};

export default async function CasesPage({ searchParams }: { searchParams: { status?: string } }) {
  const activeStatus = STATUSES.find((status) => status === searchParams.status);
  const [officers, cases, counts] = await Promise.all([
    db.officer.findMany({
      where: { active: true },
      select: { id: true, fullName: true, badge: true, rank: true },
      orderBy: { badge: "asc" },
    }),
    db.incident.findMany({
      where: activeStatus ? { caseStatus: activeStatus } : undefined,
      take: 100,
      orderBy: { updatedAt: "desc" },
      include: {
        author: { select: { fullName: true, badge: true } },
        assignee: { select: { fullName: true, badge: true } },
        suspect: { select: { id: true, fullName: true, citizenId: true } },
        evidence: { select: { id: true, locker: true, items: true, mediaUrl: true } },
      },
    }),
    Promise.all(STATUSES.map((status) => db.incident.count({ where: { caseStatus: status } }))),
  ]);
  const countsByStatus = Object.fromEntries(STATUSES.map((status, index) => [status, counts[index]])) as Record<CaseStatus, number>;
  const total = STATUSES.reduce((sum, status) => sum + countsByStatus[status], 0);

  return (
    <div className="space-y-5">
      <PageTitle
        tag="CASE MANAGEMENT"
        sub="Phân công điều tra viên, theo dõi tiến độ và lưu kết luận cùng báo cáo, công dân và bằng chứng liên quan."
        action={
          <Link href="/mdt/reports" className="btn btn-neon inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold">
            <FileText className="h-4 w-4" /> Sổ báo cáo
          </Link>
        }
      >
        Theo dõi vụ án
      </PageTitle>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/mdt/cases" className="card p-4 transition hover:border-sky-400/40">
          <span className="text-xs text-slate-400">Tất cả hồ sơ</span>
          <strong className="mt-2 block font-mono text-2xl text-white">{total}</strong>
        </Link>
        {STATUSES.map((status) => (
          <Link key={status} href={`/mdt/cases?status=${status}`} className="card p-4 transition hover:border-sky-400/40">
            <span className="text-xs text-slate-400">{statusLabels[status]}</span>
            <strong className="mt-2 block font-mono text-2xl text-white">{countsByStatus[status]}</strong>
          </Link>
        ))}
      </div>

      <Card
        title={`Sổ theo dõi (${cases.length})`}
        icon={<ClipboardList className="h-4 w-4 text-sky-200" />}
        subtitle={activeStatus ? `Đang lọc: ${statusLabels[activeStatus]}` : "Tối đa 100 hồ sơ gần nhất, sắp xếp theo lần cập nhật."}
        action={activeStatus ? <Link href="/mdt/cases" className="text-xs text-sky-200 hover:text-white">Xóa bộ lọc</Link> : undefined}
      >
        <div className="space-y-3 p-4">
          {cases.length === 0 ? (
            <Empty icon={<Search className="h-7 w-7" />}>Không có hồ sơ nào ở trạng thái này.</Empty>
          ) : cases.map((item) => (
            <article key={item.id} className="rounded-md border border-line bg-panel2/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">#{item.number}</span>
                    <Badge tone={statusTones[item.caseStatus]} dot>{statusLabels[item.caseStatus]}</Badge>
                    <span className="text-xs text-slate-500">Cập nhật {fmtDate(item.updatedAt)}</span>
                  </div>
                  <h2 className="mt-2 text-base font-semibold text-white">{item.title}</h2>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />{item.author.fullName} · #{item.author.badge}</span>
                    {item.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{item.location}</span>}
                    {item.suspect ? (
                      <Link href={`/mdt/database/citizens/${item.suspect.id}`} className="inline-flex items-center gap-1.5 text-sky-200 hover:text-white">
                        <UserRound className="h-3.5 w-3.5" />{item.suspect.fullName} · {item.suspect.citizenId}<ArrowUpRight className="h-3 w-3" />
                      </Link>
                    ) : <span className="inline-flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" />{item.suspectName ?? "Chưa rõ đối tượng"}</span>}
                    <span className="inline-flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" />{item.evidence.length} bằng chứng</span>
                  </div>
                </div>
                <span className="text-xs text-slate-500">Lập {fmtDate(item.createdAt)}</span>
              </div>

              <details className="mt-3 border-t border-line/60 pt-3">
                <summary className="cursor-pointer text-xs font-medium text-sky-200">Nội dung báo cáo và bằng chứng</summary>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{item.narrative}</p>
                {item.evidence.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {item.evidence.map((evidence) => (
                      <li key={evidence.id} className="rounded border border-line/70 px-3 py-2 text-xs text-slate-300">
                        <strong className="font-mono text-sky-200">Tủ {evidence.locker}</strong>
                        <p className="mt-1 whitespace-pre-wrap">{evidence.items}</p>
                        {evidence.mediaUrl && <a href={evidence.mediaUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sky-200 hover:text-white">Mở tệp bằng chứng</a>}
                      </li>
                    ))}
                  </ul>
                )}
              </details>

              <form action={updateIncidentCase} className="mt-4 grid gap-3 border-t border-line/70 pt-4 md:grid-cols-[minmax(150px,0.7fr)_minmax(220px,1fr)_minmax(220px,1.2fr)_auto] md:items-end">
                <input type="hidden" name="id" value={item.id} />
                <label className="block">
                  <span className="label">Trạng thái</span>
                  <select className="input" name="caseStatus" defaultValue={item.caseStatus}>
                    {STATUSES.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="label">Điều tra viên</span>
                  <select className="input" name="assigneeId" defaultValue={item.assigneeId ?? ""}>
                    <option value="">Chưa phân công</option>
                    {officers.map((officer) => (
                      <option key={officer.id} value={officer.id}>{officer.badge} · {officer.fullName} — {officer.rank}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="label">Kết luận / ghi chú</span>
                  <input className="input" name="resolution" defaultValue={item.resolution ?? ""} maxLength={3000} placeholder="Ghi chú xử lý (tối đa 3.000 ký tự)" />
                </label>
                <button className="btn btn-neon px-4 py-2 text-xs font-semibold">Lưu cập nhật</button>
              </form>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}
