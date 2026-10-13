import { redirect } from "next/navigation";
import { Check, UserCheck, X } from "lucide-react";
import { Badge, Card, Empty, PageTitle } from "@/components/ui";
import { requireOfficer } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { hasPersonnelManagement } from "@/lib/roles";
import { reviewApplication } from "../../actions";
import HrSectionNav from "../hr-section-nav";

const ASTATUS = {
  PENDING: { label: "Chờ duyệt", tone: "warn" as const, dot: true },
  APPROVED: { label: "Đã duyệt", tone: "ok" as const, dot: false },
  REJECTED: { label: "Từ chối", tone: "danger" as const, dot: false },
};

export default async function RecruitmentPage() {
  const me = await requireOfficer();
  if (!hasPersonnelManagement(me.role, me.rank)) redirect("/mdt");
  const applications = await db.application.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 40,
  });
  const pendingCount = applications.filter((application) => application.status === "PENDING").length;

  return (
    <div className="space-y-5">
      <PageTitle
        tag="RECRUITMENT"
        sub="Tiếp nhận, xem xét và phản hồi hồ sơ ứng tuyển vào lực lượng."
      >
        Khu ứng tuyển
      </PageTitle>
      <HrSectionNav active="recruitment" />

      <div className="grid gap-3 sm:grid-cols-3" aria-label="Tổng quan tuyển dụng">
        <div className="rounded-xl border border-line bg-panel p-4">
          <p className="text-xs text-slate-500">Hồ sơ đang hiển thị</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-white">{applications.length}</p>
        </div>
        <div className="rounded-xl border border-line bg-panel p-4">
          <p className="text-xs text-slate-500">Chờ xét duyệt</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-amber-200">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-line bg-panel p-4">
          <p className="text-xs text-slate-500">Đã xử lý</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-emerald-200">{applications.length - pendingCount}</p>
        </div>
      </div>

      <Card
        title={`Hồ sơ ứng tuyển (${applications.length})`}
        icon={<UserCheck className="h-4 w-4 text-emerald-400" />}
        subtitle="Mở từng hồ sơ để xem thông tin chi tiết và xử lý đơn."
      >
        {applications.length === 0 ? (
          <Empty>Chưa có đơn ứng tuyển nào được nộp.</Empty>
        ) : (
          <div className="space-y-3">
            {applications.map((application) => {
              const status = ASTATUS[application.status];
              return (
                <details key={application.id} className="group rounded-lg border border-line bg-panel2/40">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4 marker:hidden">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">
                        {application.ocName ? `${application.ocName} · IC: ${application.fullName}` : application.fullName}
                      </span>
                      <span className="mt-1 block text-xs text-slate-400">
                        {application.age} tuổi{application.gender ? ` · ${application.gender}` : ""} · Discord: {application.discord}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <Badge tone={status.tone} dot={status.dot}>{status.label}</Badge>
                      <span className="text-xs text-slate-500 group-open:hidden">Xem hồ sơ</span>
                      <span className="hidden text-xs text-slate-500 group-open:inline">Thu gọn</span>
                    </span>
                  </summary>

                  <div className="space-y-3 border-t border-line/70 p-4 text-xs leading-relaxed text-slate-300">
                    <div className="space-y-1 rounded-lg bg-panel p-3">
                      {application.priorService && <p><b className="text-white">Kinh nghiệm lực lượng:</b> {application.priorService}</p>}
                      {application.roleplayScenario && <p><b className="text-white">Tình huống Roleplay:</b> {application.roleplayScenario}</p>}
                      <p><b className="text-white">Kinh nghiệm:</b> {!application.ocName ? application.experience : "Đã tách theo từng câu trả lời ở trên."}</p>
                      <p><b className="text-white">Lý do gia nhập:</b> {application.reason}</p>
                      {application.careerGoals && <p><b className="text-white">Mục tiêu khi vào NCPD:</b> {application.careerGoals}</p>}
                      {application.strengthsWeaknesses && <p><b className="text-white">Điểm mạnh / điểm yếu:</b> {application.strengthsWeaknesses}</p>}
                      {application.activityHours && <p><b className="text-white">Khung giờ hoạt động:</b> {application.activityHours}</p>}
                      {application.minimumDutyHours && <p><b className="text-white">Giờ trực tối thiểu:</b> {application.minimumDutyHours}</p>}
                    </div>

                    {application.ocName && (
                      <div className="space-y-1 rounded-lg border border-line/70 p-3">
                        <p className="mb-2 font-semibold text-white">Cam kết ứng viên</p>
                        <p>Sẵn sàng tham gia huấn luyện: {application.trainingCommitment ? "Đồng ý" : "Chưa xác nhận"}</p>
                        <p>Nội quy NOVARIS CITY: {application.rulesCommitment ? "Đồng ý" : "Chưa xác nhận"}</p>
                        <p>Tôn trọng cư dân và đồng đội: {application.conductCommitment ? "Đồng ý" : "Chưa xác nhận"}</p>
                        <p>Hoàn thành đào tạo: {application.trainingCompletionCommitment ? "Đồng ý" : "Chưa xác nhận"}</p>
                        <p>Quy định hoạt động tối thiểu: {application.earlyDeparturePenaltyCommitment ? "Đã xác nhận" : "Chưa xác nhận"}</p>
                        <p>Lời cam kết ứng viên: {application.applicantDeclaration ? "Đã xác nhận" : "Chưa xác nhận"}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-between gap-2 font-mono text-[11px] text-slate-500">
                      <span>Mã đơn: {application.trackingCode}</span>
                      <span>{fmtDate(application.createdAt)}</span>
                    </div>

                    {application.status === "PENDING" && (
                      <form action={reviewApplication} className="flex flex-wrap items-center gap-2 border-t border-line/50 pt-3">
                        <input type="hidden" name="id" value={application.id} />
                        <input name="note" placeholder="Ghi chú phản hồi cho ứng viên..." className="input min-w-40 flex-1 py-2 text-xs" />
                        <button name="status" value="APPROVED" className="btn btn-ok min-h-10 px-3 text-xs font-semibold">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" /> Duyệt
                        </button>
                        <button name="status" value="REJECTED" className="btn btn-danger min-h-10 px-3 text-xs font-semibold">
                          <X className="h-3.5 w-3.5" aria-hidden="true" /> Từ chối
                        </button>
                      </form>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
