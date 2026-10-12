import { redirect } from "next/navigation";
import { Users, Clock, UserCheck, ShieldCheck, FileWarning, UserPlus, Check, X, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { Badge, Card, Empty, Field, PageTitle } from "@/components/ui";
import { fmtDate, formatDuration } from "@/lib/utils";
import { hasPersonnelManagement, OFFICER_RANKS } from "@/lib/roles";
import { createOfficer, reviewApplication, updateOfficer, updateReportStatus } from "../actions";

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

  // Payroll: tổng giờ trong 7 ngày gần nhất
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [officers, apps, logs, reports] = await Promise.all([
    db.officer.findMany({ orderBy: [{ role: "desc" }, { badge: "asc" }] }),
    db.application.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 40 }),
    db.dutyLog.findMany({ where: { clockIn: { gte: since } } }),
    db.publicReport.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  const now = Date.now();
  const hours = new Map<string, number>();
  for (const l of logs) {
    const end = l.clockOut ? l.clockOut.getTime() : now;
    hours.set(l.officerId, (hours.get(l.officerId) ?? 0) + (end - l.clockIn.getTime()));
  }

  return (
    <div className="space-y-6">
      <PageTitle
        tag="PERSONNEL MANAGEMENT"
        sub="Quản lý nhân sự, cấp bậc, chấm công và xử lý hồ sơ học viện."
      >
        Quản lý nội bộ & Nhân sự
      </PageTitle>

      {/* Roster & Payroll Table */}
      <Card
        title={`Quân số & Chấm công 7 ngày gần nhất (${officers.length} Sĩ quan)`}
        icon={<Users className="h-4 w-4 text-neon" />}
        subtitle="Giờ trực tính tự động từ nút Bắt đầu / Kết thúc On-Duty ở Dashboard"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="th">Sĩ quan & Tài khoản</th>
                <th className="th">Cấp bậc (Rank)</th>
                <th className="th">Số hiệu (Badge)</th>
                <th className="th">Phân quyền</th>
                <th className="th">Trạng thái</th>
                <th className="th text-right">Giờ trực</th>
                <th className="th">Lương / giờ</th>
                <th className="th text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {officers.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-line/40 transition hover:bg-panel2/60"
                >
                  <td className="td py-2.5">
                    <p className="font-semibold text-white">{o.fullName}</p>
                    <p className="font-mono text-xs text-slate-400">
                      @{o.username}
                      {o.onDuty && (
                        <span className="ml-1.5 text-emerald-400 font-bold">
                          ● ON-DUTY {o.callsign}
                        </span>
                      )}
                    </p>
                    <form action={updateOfficer} id={`officer-${o.id}`}>
                      <input type="hidden" name="id" value={o.id} />
                    </form>
                  </td>
                  <td className="td">
                    <select
                      form={`officer-${o.id}`}
                      name="rank"
                      defaultValue={o.rank}
                      aria-label={`Cấp bậc của ${o.fullName}`}
                      className="input w-32 py-1 text-xs"
                    >
                      {!OFFICER_RANKS.some((rank) => rank === o.rank) && (
                        <option value={o.rank}>{o.rank}</option>
                      )}
                      {OFFICER_RANKS.map((rank) => (
                        <option key={rank} value={rank}>{rank}</option>
                      ))}
                    </select>
                  </td>
                  <td className="td">
                    <input
                      form={`officer-${o.id}`}
                      name="badge"
                      defaultValue={o.badge}
                      aria-label={`Số hiệu của ${o.fullName}`}
                      className="input w-20 py-1 font-mono text-xs text-center"
                    />
                  </td>
                  <td className="td">
                    <select
                      form={`officer-${o.id}`}
                      name="role"
                      defaultValue={o.role}
                      aria-label={`Phân quyền của ${o.fullName}`}
                      className="input w-40 py-1 text-xs"
                      disabled={o.id === me.id}
                    >
                      <option value="OFFICER">Officer</option>
                      <option value="SUPERVISOR">Supervisor</option>
                      <option value="ACCOUNTING">Phòng Kế Toán</option>
                      <option value="FTO">Phòng FTO</option>
                      <option value="HIGH_COMMAND">High Command</option>
                    </select>
                  </td>
                  <td className="td text-center">
                    <input
                      form={`officer-${o.id}`}
                      type="checkbox"
                      name="active"
                      defaultChecked={o.active}
                      disabled={o.id === me.id}
                      aria-label={`Trạng thái tài khoản của ${o.fullName}`}
                      className="rounded"
                    />
                  </td>
                  <td className="td text-right font-mono text-xs font-bold text-neon">
                    {formatDuration(hours.get(o.id) ?? 0)}
                  </td>
                  <td className="td">
                    <input
                      form={`officer-${o.id}`}
                      name="salaryPerHour"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={o.salaryPerHour}
                      aria-label={`Lương mỗi giờ của ${o.fullName}`}
                      className="input w-28 py-1 text-xs"
                    />
                  </td>
                  <td className="td text-right">
                    <button form={`officer-${o.id}`} className="btn btn-neon px-3 py-1 text-xs">
                      Lưu
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create Officer */}
        <div>
          <Card
            title="Thêm sĩ quan mới"
            icon={<UserPlus className="h-4 w-4 text-neon" />}
            subtitle="Cấp tài khoản truy cập MDT cho thành viên mới"
          >
            <form action={createOfficer} className="space-y-3.5">
              <Field label="Họ tên IC *" required>
                <input name="fullName" placeholder="VD: John Connor" className="input" required />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tài khoản *" required>
                  <input name="username" placeholder="jconnor" className="input" required />
                </Field>
                <Field label="Badge #" required hint="VD: 104">
                  <input name="badge" placeholder="104" className="input font-mono" required />
                </Field>
              </div>
              <Field label="Cấp bậc ban đầu">
                <input name="rank" defaultValue="Cadet" className="input" />
              </Field>
              <Field label="Mật khẩu khởi tạo *" required hint="Ít nhất 6 ký tự">
                <input
                  name="password"
                  type="password"
                  minLength={6}
                  placeholder="••••••••"
                  className="input"
                  required
                />
              </Field>
              <button className="btn btn-neon w-full py-2.5 font-semibold text-xs tracking-wider">
                TẠO TÀI KHOẢN SĨ QUAN
              </button>
            </form>
          </Card>
        </div>

        {/* Applications & Public Reports */}
        <div className="space-y-6 lg:col-span-2">
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
