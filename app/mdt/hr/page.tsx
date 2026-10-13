import { redirect } from "next/navigation";
import { UserCheck, FileWarning, Check, X, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { Badge, Card, Empty, PageTitle } from "@/components/ui";
import { fmtDate, formatDuration } from "@/lib/utils";
import { hasPersonnelManagement } from "@/lib/roles";
import { reviewApplication, updateReportStatus } from "../actions";
import PersonnelRoster from "./personnel-roster";

const ASTATUS = {
  PENDING: { label: "Chờ duyệt", tone: "warn" as const, dot: true },
  APPROVED: { label: "Đã duyệt", tone: "ok" as const, dot: false },
  REJECTED: { label: "Từ chối", tone: "danger" as const, dot: false },
};

const RSTATUS = {
  PENDING: "Chờ tiếp nhận",
  REVIEWING: "Đang xử lý",
  CLOSED: "Đã đóng",
};

export default async function HRPage() {
  const me = await requireOfficer();
  if (!hasPersonnelManagement(me.role, me.rank)) redirect("/mdt");

  // Payroll: tổng giờ trong 7 ngày gần nhất.
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [officers, apps, logs, reports] = await Promise.all([
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
    db.application.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 40 }),
    db.dutyLog.findMany({ where: { clockIn: { gte: since } } }),
    db.publicReport.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  const now = Date.now();
  const hoursMsByOfficer: Record<string, number> = {};
  for (const l of logs) {
    const end = l.clockOut ? l.clockOut.getTime() : now;
    hoursMsByOfficer[l.officerId] = (hoursMsByOfficer[l.officerId] ?? 0) + (end - l.clockIn.getTime());
  }
  const hoursByOfficer = Object.fromEntries(
    Object.entries(hoursMsByOfficer).map(([officerId, duration]) => [officerId, formatDuration(duration)]),
  );

  return (
    <div className="space-y-6">
      <PageTitle
        tag="PERSONNEL MANAGEMENT"
        sub="Quản lý nhân sự, cấp bậc, chấm công và xử lý hồ sơ học viện."
      >
        Quản lý nội bộ & Nhân sự
      </PageTitle>

      <PersonnelRoster
        officers={officers}
        hoursByOfficer={hoursByOfficer}
        currentOfficerId={me.id}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Applications & Public Reports */}
        <div className="space-y-6">
          {/* Applications */}
          <Card
            title={`Đơn ứng tuyển Học viện (${apps.length})`}
            icon={<UserCheck className="h-4 w-4 text-emerald-400" />}
            subtitle="Xét duyệt hồ sơ ứng viên đăng ký vào lực lượng"
          >
            {apps.length === 0 ? (
              <Empty>Chưa có đơn ứng tuyển nào được nộp.</Empty>
            ) : (
              <div className="space-y-3.5">
                {apps.map((a) => {
                  const s = ASTATUS[a.status];
                  return (
                    <div
                      key={a.id}
                      className="rounded-xl border border-line bg-panel2/60 p-4 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-white text-sm">{a.ocName ? `${a.ocName} · IC: ${a.fullName}` : a.fullName}</span>
                          <span className="text-slate-400 ml-2 font-mono">
                            {a.age} tuổi{a.gender ? ` · ${a.gender}` : ""} · Discord: <b className="text-neon">{a.discord}</b>
                          </span>
                        </div>
                        <Badge tone={s.tone} dot={s.dot}>
                          {s.label}
                        </Badge>
                      </div>

                      <div className="rounded-lg bg-panel p-2.5 space-y-1 text-slate-300">
                        {a.priorService && <p><b className="text-white">Kinh nghiệm lực lượng:</b> {a.priorService}</p>}
                        {a.roleplayScenario && <p><b className="text-white">Tình huống Roleplay:</b> {a.roleplayScenario}</p>}
                        <p>
                          <b className="text-white">Kinh nghiệm (hồ sơ cũ):</b> {!a.ocName ? a.experience : "Đã tách theo từng câu trả lời ở trên."}
                        </p>
                        <p>
                          <b className="text-white">Lý do gia nhập:</b> {a.reason}
                        </p>
                        {a.ocName && <p><b className="text-white">Họ tên OC:</b> {a.ocName}</p>}
                        {a.gender && <p><b className="text-white">Giới tính:</b> {a.gender}</p>}
                        {a.careerGoals && <p><b className="text-white">Mục tiêu khi vào NCPD:</b> {a.careerGoals}</p>}
                        {a.strengthsWeaknesses && <p><b className="text-white">Điểm mạnh / điểm yếu:</b> {a.strengthsWeaknesses}</p>}
                        {a.activityHours && <p><b className="text-white">Khung giờ hoạt động:</b> {a.activityHours}</p>}
                        {a.minimumDutyHours && <p><b className="text-white">Giờ trực tối thiểu:</b> {a.minimumDutyHours}</p>}
                        {a.ocName && (
                          <div className="mt-2 border-t border-line/50 pt-2">
                            <p className="font-semibold text-white">Xác nhận cam kết</p>
                            <p>Sẵn sàng tham gia huấn luyện: {a.trainingCommitment ? "Đồng ý" : "Chưa xác nhận"}</p>
                            <p>Nội quy NOVARIS CITY: {a.rulesCommitment ? "Đồng ý" : "Chưa xác nhận"}</p>
                            <p>Tôn trọng cư dân và đồng đội: {a.conductCommitment ? "Đồng ý" : "Chưa xác nhận"}</p>
                            <p>Hoàn thành đào tạo: {a.trainingCompletionCommitment ? "Đồng ý" : "Chưa xác nhận"}</p>
                            <p>Hoạt động tối thiểu 2 tuần / quy định xử lý trong game: {a.earlyDeparturePenaltyCommitment ? "Đã xác nhận" : "Chưa xác nhận"}</p>
                            <p>Lời cam kết ứng viên: {a.applicantDeclaration ? "Đã xác nhận" : "Chưa xác nhận"}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between font-mono text-[11px] text-slate-500 pt-1">
                        <span>Mã đơn: {a.trackingCode}</span>
                        <span>{fmtDate(a.createdAt)}</span>
                      </div>

                      {a.status === "PENDING" && (
                        <form
                          action={reviewApplication}
                          className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/40"
                        >
                          <input type="hidden" name="id" value={a.id} />
                          <input
                            name="note"
                            placeholder="Ghi chú phản hồi cho ứng viên..."
                            className="input flex-1 py-1 text-xs"
                          />
                          <button
                            name="status"
                            value="APPROVED"
                            className="btn btn-ok px-3 py-1 text-xs font-mono font-semibold"
                          >
                            <Check className="h-3.5 w-3.5" /> Duyệt
                          </button>
                          <button
                            name="status"
                            value="REJECTED"
                            className="btn btn-danger px-3 py-1 text-xs font-mono font-semibold"
                          >
                            <X className="h-3.5 w-3.5" /> Từ chối
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Citizen Crime Reports */}
          <Card
            title={`Báo án tiếp nhận từ Công dân (${reports.length})`}
            icon={<FileWarning className="h-4 w-4 text-amber-400" />}
            subtitle="Các đơn tường trình sự việc nộp qua Cổng Online"
          >
            {reports.length === 0 ? (
              <Empty>Chưa có báo án nào từ người dân.</Empty>
            ) : (
              <div className="space-y-3.5">
                {reports.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-line bg-panel2/60 p-4 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white text-sm">{r.title}</p>
                      <span className="font-mono text-xs text-neon">{r.trackingCode}</span>
                    </div>

                    <p className="text-slate-400">
                      Người báo: <b className="text-slate-200">{r.reporterName}</b>
                      {r.phone && ` · SĐT: ${r.phone}`}
                      {r.location && ` · Địa điểm: ${r.location}`}
                      <span> · {fmtDate(r.createdAt)}</span>
                    </p>

                    <p className="whitespace-pre-wrap text-slate-200 leading-relaxed bg-panel p-2.5 rounded-lg">
                      {r.description}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      {r.evidenceUrl ? (
                        <a
                          href={r.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-neon py-1 px-2.5 text-xs font-mono inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" /> Xem Bằng chứng ↗
                        </a>
                      ) : (
                        <span className="text-slate-500">Không đính kèm bằng chứng</span>
                      )}

                      <form action={updateReportStatus} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={r.id} />
                        <select
                          name="status"
                          defaultValue={r.status}
                          className="input w-36 py-1 text-xs"
                        >
                          {Object.entries(RSTATUS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                        <button className="btn px-2.5 py-1 text-xs font-mono">
                          Lưu trạng thái
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
