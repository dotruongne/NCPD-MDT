import { redirect } from "next/navigation";
import { ExternalLink, FileWarning } from "lucide-react";
import { Badge, Card, Empty, PageTitle } from "@/components/ui";
import { requireOfficer } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { hasPersonnelManagement } from "@/lib/roles";
import { updateReportStatus } from "../../actions";
import HrSectionNav from "../hr-section-nav";

const REPORT_STATUS = {
  PENDING: "Chờ tiếp nhận",
  REVIEWING: "Đang xử lý",
  CLOSED: "Đã đóng",
};

export default async function CitizenReportsPage() {
  const me = await requireOfficer();
  if (!hasPersonnelManagement(me.role, me.rank)) redirect("/mdt");
  const reports = await db.publicReport.findMany({ orderBy: { createdAt: "desc" }, take: 20 });

  return (
    <div className="space-y-5">
      <PageTitle
        tag="CITIZEN REPORTS"
        sub="Tiếp nhận và cập nhật trạng thái các tường trình gửi từ Cổng Online."
      >
        Báo án công dân
      </PageTitle>
      <HrSectionNav active="reports" />
      <Card
        title={`Báo án tiếp nhận từ công dân (${reports.length})`}
        icon={<FileWarning className="h-4 w-4 text-amber-400" />}
        subtitle="Các đơn tường trình sự việc nộp qua Cổng Online."
      >
        {reports.length === 0 ? (
          <Empty>Chưa có báo án nào từ người dân.</Empty>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <article key={report.id} className="space-y-3 rounded-lg border border-line bg-panel2/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold text-white">{report.title}</h2>
                  <Badge tone={report.status === "CLOSED" ? "neutral" : report.status === "REVIEWING" ? "info" : "warn"}>
                    {REPORT_STATUS[report.status]}
                  </Badge>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  Người báo: <b className="text-slate-200">{report.reporterName}</b>
                  {report.phone && ` · SĐT: ${report.phone}`}
                  {report.location && ` · Địa điểm: ${report.location}`}
                  {` · ${fmtDate(report.createdAt)}`}
                </p>
                <p className="whitespace-pre-wrap rounded-lg bg-panel p-3 text-sm leading-relaxed text-slate-200">
                  {report.description}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/50 pt-3">
                  {report.evidenceUrl ? (
                    <a href={report.evidenceUrl} target="_blank" rel="noopener noreferrer" className="btn btn-neon min-h-10 px-3 text-xs">
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Xem bằng chứng
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">Không đính kèm bằng chứng</span>
                  )}
                  <form action={updateReportStatus} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={report.id} />
                    <label className="sr-only" htmlFor={`report-status-${report.id}`}>Trạng thái báo án</label>
                    <select id={`report-status-${report.id}`} name="status" defaultValue={report.status} className="input min-h-10 w-44 py-2 text-xs">
                      {Object.entries(REPORT_STATUS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <button className="btn min-h-10 px-3 text-xs">Lưu trạng thái</button>
                  </form>
                </div>
                <p className="font-mono text-[11px] text-slate-500">Mã đơn: {report.trackingCode}</p>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
