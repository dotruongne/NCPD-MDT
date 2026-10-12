import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  CalendarClock,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  NotebookPen,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { hasFinanceAccess, hasFtoAccess, hasPersonnelManagement } from "@/lib/roles";
import { dutyHoursInPeriod, fmtDate, money } from "@/lib/utils";
import {
  createFtoAssignment,
  createFtoEvaluation,
  createFtoTrainingLog,
  recordPayrollPayment,
} from "../actions";

const APPLICATION_STATUS = {
  PENDING: { label: "Chờ xét duyệt", className: "department-status-pending" },
  APPROVED: { label: "Đã duyệt", className: "department-status-approved" },
  REJECTED: { label: "Từ chối", className: "department-status-rejected" },
};

export async function DepartmentWorkspace({ section }: { section: "finance" | "fto" }) {
  const me = await requireOfficer();
  const canSeeFinance = section === "finance" && hasFinanceAccess(me.role, me.rank);
  const canSeeFto = section === "fto" && hasFtoAccess(me.role, me.rank);
  if (!canSeeFinance && !canSeeFto) redirect("/mdt");
  const canManagePersonnel = hasPersonnelManagement(me.role, me.rank);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const payrollPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [officers, dutyLogs, applications, pendingApplications, fundTransactions, fundTotals, untrackedPaidFines, untrackedPaidFineTotals, paidPayrolls, ftoCandidates, ftoTrainers, ftoAssignments, trainingLogs, trainingEvaluations] = await Promise.all([
    canSeeFinance || canSeeFto
      ? db.officer.findMany({
          where: { active: true },
          select: {
            id: true,
            fullName: true,
            rank: true,
            badge: true,
            role: true,
            onDuty: true,
            salaryPerHour: true,
          },
          orderBy: [{ onDuty: "desc" }, { badge: "asc" }],
        })
      : Promise.resolve([]),
    canSeeFinance
      ? db.dutyLog.findMany({
          where: {
            clockIn: { lt: now },
            OR: [{ clockOut: null }, { clockOut: { gt: monthStart } }],
          },
          select: { officerId: true, clockIn: true, clockOut: true },
        })
      : Promise.resolve([]),
    canSeeFto
      ? db.application.findMany({
          select: {
            id: true,
            fullName: true,
            discord: true,
            age: true,
            experience: true,
            reason: true,
            ocName: true,
            gender: true,
            priorService: true,
            roleplayScenario: true,
            careerGoals: true,
            strengthsWeaknesses: true,
            activityHours: true,
            minimumDutyHours: true,
            trainingCommitment: true,
            rulesCommitment: true,
            conductCommitment: true,
            trainingCompletionCommitment: true,
            earlyDeparturePenaltyCommitment: true,
            applicantDeclaration: true,
            status: true,
            trackingCode: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 8,
        })
      : Promise.resolve([]),
    canSeeFto ? db.application.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
    canSeeFinance
      ? db.fundTransaction.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            createdBy: { select: { fullName: true, badge: true } },
            payrollOfficer: { select: { fullName: true, badge: true } },
          },
        })
      : Promise.resolve([]),
    canSeeFinance
      ? db.fundTransaction.groupBy({
          by: ["type"],
          _sum: { amount: true },
        })
      : Promise.resolve([]),
    canSeeFinance
      ? db.fineRecord.findMany({
          where: { paid: true, fundTransaction: null },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            reason: true,
            amount: true,
            createdAt: true,
            citizen: { select: { fullName: true } },
          },
        })
      : Promise.resolve([]),
    canSeeFinance
      ? db.fineRecord.aggregate({
          where: { paid: true, fundTransaction: null },
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: null } }),
    canSeeFinance
      ? db.fundTransaction.findMany({
          where: { category: "PAYROLL", payrollPeriod },
          select: { payrollOfficerId: true },
        })
      : Promise.resolve([]),
    canSeeFto
      ? db.officer.findMany({
          where: {
            active: true,
            rank: "Cadet",
            ftoTraineeAssignments: { none: { status: "ACTIVE" } },
          },
          select: { id: true, fullName: true, badge: true },
          orderBy: { badge: "asc" },
        })
      : Promise.resolve([]),
    canSeeFto
      ? db.officer.findMany({
          where: { active: true, role: "FTO" },
          select: { id: true, fullName: true, badge: true },
          orderBy: { badge: "asc" },
        })
      : Promise.resolve([]),
    canSeeFto
      ? db.ftoAssignment.findMany({
          orderBy: [{ status: "asc" }, { assignedAt: "desc" }],
          take: 50,
          include: {
            trainee: { select: { id: true, fullName: true, badge: true, rank: true } },
            trainer: { select: { id: true, fullName: true, badge: true } },
            assignedBy: { select: { fullName: true, badge: true } },
          },
        })
      : Promise.resolve([]),
    canSeeFto
      ? db.ftoTrainingLog.findMany({
          orderBy: [{ sessionDate: "desc" }],
          take: 20,
          include: {
            assignment: {
              select: {
                trainee: { select: { fullName: true, badge: true } },
                trainer: { select: { fullName: true, badge: true } },
              },
            },
            author: { select: { fullName: true, badge: true } },
          },
        })
      : Promise.resolve([]),
    canSeeFto
      ? db.ftoEvaluation.findMany({
          orderBy: [{ evaluatedAt: "desc" }],
          take: 20,
          include: {
            assignment: {
              select: {
                trainee: { select: { fullName: true, badge: true } },
                trainer: { select: { fullName: true, badge: true } },
              },
            },
            author: { select: { fullName: true, badge: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const officersWithPayroll = officers.map((officer) => {
    const logs = dutyLogs.filter((log) => log.officerId === officer.id);
    const hours = dutyHoursInPeriod(logs, monthStart, now);
    return { ...officer, hours, estimatedPay: Math.round(hours * officer.salaryPerHour) };
  });
  const totalEstimatedPay = officersWithPayroll.reduce((sum, officer) => sum + officer.estimatedPay, 0);
  const activeUnits = officers.filter((officer) => officer.onDuty).length;
  const activeFtoAssignments = ftoAssignments.filter((assignment) => assignment.status === "ACTIVE");
  const incomeTotal =
    fundTotals.find((total) => total.type === "INCOME")?._sum.amount ?? 0;
  const expenseTotal =
    fundTotals.find((total) => total.type === "EXPENSE")?._sum.amount ?? 0;
  const legacyIncomeTotal = untrackedPaidFineTotals._sum.amount ?? 0;
  const fundBalance = incomeTotal + legacyIncomeTotal - expenseTotal;
  const paidPayrollOfficerIds = new Set(
    paidPayrolls.map((transaction) => transaction.payrollOfficerId).filter((id): id is string => Boolean(id))
  );
  const ledgerRows = [
    ...fundTransactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      category: transaction.category === "FINE_COLLECTION"
        ? "Thu tiền phạt"
        : transaction.category === "IMPOUND_FEE"
        ? "Thu phí lấy xe"
        : "Chi trả lương",
      description: transaction.description,
      amount: transaction.amount,
      createdAt: transaction.createdAt,
      actor: `${transaction.createdBy.fullName} #${transaction.createdBy.badge}`,
    })),
    ...untrackedPaidFines.map((fine) => ({
      id: `legacy-${fine.id}`,
      type: "INCOME" as const,
      category: "Tiền phạt đã thu",
      description: `${fine.reason}${fine.citizen ? ` · ${fine.citizen.fullName}` : ""}`,
      amount: fine.amount,
      createdAt: fine.createdAt,
      actor: "Đã nộp trước khi có sổ quỹ",
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 20);
  const applicationStatusCounts = applications.reduce(
    (counts, application) => {
      counts[application.status] += 1;
      return counts;
    },
    { PENDING: 0, APPROVED: 0, REJECTED: 0 }
  );

  return (
    <div className="department-workspace">
      <header className="department-hero">
        <div>
          <div className="department-kicker">
            <Building2 className="h-4 w-4" />
            <span>NCPD · KHỐI NGHIỆP VỤ NỘI BỘ</span>
            <span className="department-secure"><i /> PHÂN QUYỀN THEO CHỨC VỤ</span>
          </div>
          <h1 className="department-title">{canSeeFinance ? "Phòng Tài chính" : "Phòng Huấn luyện FTO"}</h1>
          <p className="department-description">
            {canSeeFinance
              ? "Đối soát sổ quỹ, các khoản thu phạt, chi trả lương và thời gian công tác."
              : "Theo dõi hồ sơ tuyển dụng và công tác huấn luyện, đánh giá sĩ quan mới."}
          </p>
        </div>
        <div className="department-access">
          <ShieldCheck className="h-5 w-5" />
          <div>
            <span>QUYỀN TRUY CẬP</span>
            <strong>{canSeeFinance ? "Tài chính" : "Huấn luyện FTO"}</strong>
          </div>
        </div>
      </header>

      {canSeeFinance && (
        <section className="department-section" aria-labelledby="finance-heading">
          <header className="department-section-heading">
            <div className="department-section-icon"><CircleDollarSign className="h-5 w-5" /></div>
            <div>
              <p className="department-section-kicker">PAYROLL & DUTY ACCOUNTING</p>
              <h2 id="finance-heading">Phòng Tài chính</h2>
              <p>Lương theo giờ và thời gian trực ghi nhận trong kỳ hiện tại.</p>
            </div>
            <span className="department-section-code">FINANCE / 01</span>
          </header>

          <div className="department-stat-grid department-finance-stats">
            <article className="department-stat">
              <span className="department-stat-label"><WalletCards className="h-4 w-4" /> TỔNG LƯƠNG ƯỚC TÍNH</span>
              <strong>{money(totalEstimatedPay)}</strong>
              <small>Nhân sự đang hoạt động · trước thưởng/khấu trừ</small>
            </article>
            <article className="department-stat">
              <span className="department-stat-label"><Users className="h-4 w-4" /> NHÂN SỰ ĐANG TRỰC</span>
              <strong>{activeUnits}<em> / {officers.length}</em></strong>
              <small>Sĩ quan active có trạng thái On-Duty</small>
            </article>
            <article className="department-stat">
              <span className="department-stat-label"><Clock3 className="h-4 w-4" /> KỲ ĐỐI SOÁT</span>
              <strong>{String(now.getMonth() + 1).padStart(2, "0")}/{now.getFullYear()}</strong>
              <small>Từ ngày đầu tháng đến thời điểm hiện tại</small>
            </article>
          </div>

          <section className="department-panel department-fund-panel" aria-labelledby="fund-heading">
            <header className="department-fund-header">
              <div>
                <p className="department-section-kicker">NCPD TREASURY · ACCOUNTING LEDGER</p>
                <h3 id="fund-heading">Sổ quỹ đơn vị</h3>
                <p>Đối soát tiền phạt đã xác nhận thu và các khoản lương đã ghi nhận chi.</p>
              </div>
              <div className="department-fund-balance">
                <span>SỐ DƯ HIỆN TẠI</span>
                <strong>{money(fundBalance)}</strong>
              </div>
            </header>
            <div className="department-fund-totals">
              <div><span><ArrowDownLeft className="h-4 w-4" /> TỔNG THU</span><strong>{money(incomeTotal + legacyIncomeTotal)}</strong></div>
              <div><span><ArrowUpRight className="h-4 w-4" /> TỔNG CHI</span><strong>{money(expenseTotal)}</strong></div>
              <div><span><CircleDollarSign className="h-4 w-4" /> CÒN LẠI</span><strong>{money(fundBalance)}</strong></div>
            </div>
            {ledgerRows.length === 0 ? (
              <div className="department-empty">Chưa có khoản thu hoặc chi được ghi vào sổ quỹ.</div>
            ) : (
              <div className="department-table-wrap">
                <table className="department-table department-ledger-table">
                  <thead>
                    <tr>
                      <th>Thời điểm</th>
                      <th>Diễn giải</th>
                      <th>Người ghi nhận</th>
                      <th className="department-align-right">Phát sinh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerRows.map((entry) => (
                      <tr key={entry.id}>
                        <td className="department-mono">{fmtDate(entry.createdAt)}</td>
                        <td>
                          <strong className="department-ledger-category">{entry.category}</strong>
                          <span className="department-ledger-description">{entry.description}</span>
                        </td>
                        <td className="department-rank">{entry.actor}</td>
                        <td className={`department-align-right department-ledger-amount ${entry.type === "INCOME" ? "department-ledger-income" : "department-ledger-expense"}`}>
                          {entry.type === "INCOME" ? "+" : "−"}{money(entry.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <footer className="department-notice">
              <BadgeCheck className="h-4 w-4" />
              <p>Tiền phạt chỉ vào quỹ khi biên bản được xác nhận “Đã nộp”. Lương chỉ trừ quỹ khi kế toán ghi nhận chi trả; lương tạm tính chưa phải khoản đã chi.</p>
            </footer>
          </section>

          <section className="department-panel">
            <header className="department-panel-header">
              <div>
                <h3><ClipboardCheck className="h-4 w-4" /> Bảng đối soát chấm công & lương</h3>
                <p>Tính theo duty log và mức lương/giờ đã thiết lập · thanh toán ghi nhận riêng theo kỳ.</p>
              </div>
              {canManagePersonnel && (
                <Link href="/mdt/hr" className="department-action-link">
                  Quản lý nhân sự <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </header>
            {officersWithPayroll.length === 0 ? (
              <div className="department-empty">Chưa có hồ sơ sĩ quan đang hoạt động để đối soát.</div>
            ) : (
              <div className="department-table-wrap">
                <table className="department-table">
                  <thead>
                    <tr>
                      <th>Sĩ quan</th>
                      <th>Cấp bậc</th>
                      <th className="department-align-right">Giờ trực</th>
                      <th className="department-align-right">Mức lương / giờ</th>
                      <th className="department-align-right">Tạm tính kỳ này</th>
                      <th className="department-align-right">Thanh toán</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officersWithPayroll.map((officer) => (
                      <tr key={officer.id}>
                        <td>
                          <strong className="department-officer-name">{officer.fullName}</strong>
                          <span className="department-badge-number">#{officer.badge}</span>
                          {officer.onDuty && <span className="department-on-duty"><i /> ĐANG TRỰC</span>}
                        </td>
                        <td className="department-rank">{officer.rank}</td>
                        <td className="department-align-right department-mono">{officer.hours.toFixed(1)} giờ</td>
                        <td className="department-align-right department-mono">{money(officer.salaryPerHour)}</td>
                        <td className="department-align-right department-pay">{money(officer.estimatedPay)}</td>
                        <td className="department-align-right">
                          {paidPayrollOfficerIds.has(officer.id) ? (
                            <span className="department-payroll-paid"><BadgeCheck className="h-3.5 w-3.5" /> Đã chi kỳ này</span>
                          ) : officer.estimatedPay > 0 ? (
                            <form action={recordPayrollPayment}>
                              <input type="hidden" name="officerId" value={officer.id} />
                              <button className="department-payroll-button" title={`Ghi nhận chi ${money(officer.estimatedPay)} từ quỹ`}>
                                Ghi nhận chi
                              </button>
                            </form>
                          ) : (
                            <span className="department-payroll-pending">Chưa phát sinh</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <footer className="department-notice">
              <BadgeCheck className="h-4 w-4" />
              <p>
                Mức tạm tính theo giờ trực; bấm “Ghi nhận chi” sau khi thực trả để trừ đúng số tiền khỏi quỹ.
                Mỗi sĩ quan chỉ được ghi nhận một lần trong mỗi kỳ tháng.
              </p>
            </footer>
          </section>
        </section>
      )}

      {canSeeFto && (
        <section className="department-section" aria-labelledby="fto-heading">
          <header className="department-section-heading">
            <div className="department-section-icon department-section-icon-training"><GraduationCap className="h-5 w-5" /></div>
            <div>
              <p className="department-section-kicker">FIELD TRAINING & ACADEMY</p>
              <h2 id="fto-heading">Phòng Huấn luyện FTO</h2>
              <p>Học viện, hướng dẫn thực địa và đánh giá năng lực sĩ quan mới.</p>
            </div>
            <span className="department-section-code">TRAINING / 02</span>
          </header>

          <div className="department-fto-grid">
            <div className="department-fto-main">
              <div className="department-stat-grid department-fto-stats">
                <article className="department-stat">
                  <span className="department-stat-label"><Users className="h-4 w-4" /> HỌC VIÊN ĐANG ĐƯỢC KÈM CẶP</span>
                  <strong>{activeFtoAssignments.length}</strong>
                  <small>Phân công FTO chưa hoàn tất</small>
                </article>
                <article className="department-stat department-stat-warning">
                  <span className="department-stat-label"><ClipboardCheck className="h-4 w-4" /> ĐƠN HỌC VIỆN CHỜ DUYỆT</span>
                  <strong>{pendingApplications}</strong>
                  <small>Quy trình tuyển dụng riêng với huấn luyện FTO</small>
                </article>
              </div>

              <section className="department-panel">
                <header className="department-panel-header">
                  <div>
                    <h3><Users className="h-4 w-4" /> Phân công học viên cho FTO</h3>
                    <p>Chọn Cadet và FTO đang hoạt động; mỗi học viên chỉ có một FTO phụ trách tại một thời điểm.</p>
                  </div>
                </header>
                <form action={createFtoAssignment} className="department-form-grid">
                  <label className="department-field">
                    <span>HỌC VIÊN · CADET</span>
                    <select name="traineeId" required defaultValue="" disabled={!ftoCandidates.length}>
                      <option value="" disabled>{ftoCandidates.length ? "Chọn học viên" : "Không có Cadet chưa được phân công"}</option>
                      {ftoCandidates.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>{candidate.fullName} · #{candidate.badge}</option>
                      ))}
                    </select>
                  </label>
                  <label className="department-field">
                    <span>FTO PHỤ TRÁCH</span>
                    <select name="trainerId" required defaultValue="" disabled={!ftoTrainers.length}>
                      <option value="" disabled>{ftoTrainers.length ? "Chọn FTO" : "Chưa có sĩ quan được cấp role FTO"}</option>
                      {ftoTrainers.map((trainer) => (
                        <option key={trainer.id} value={trainer.id}>{trainer.fullName} · #{trainer.badge}</option>
                      ))}
                    </select>
                  </label>
                  <label className="department-field department-field-wide">
                    <span>MỤC TIÊU / GHI CHÚ BAN ĐẦU</span>
                    <input name="notes" maxLength={1000} placeholder="Ví dụ: hoàn thành giai đoạn huấn luyện tuần tra cơ bản" />
                  </label>
                  <button className="department-form-submit" disabled={!ftoCandidates.length || !ftoTrainers.length}>
                    <Users className="h-4 w-4" /> Tạo phân công
                  </button>
                </form>
                {ftoAssignments.length ? (
                  <div className="department-table-wrap">
                    <table className="department-table department-fto-assignment-table">
                      <thead>
                        <tr><th>Học viên</th><th>FTO phụ trách</th><th>Ngày phân công</th><th>Tiến độ</th></tr>
                      </thead>
                      <tbody>
                        {ftoAssignments.map((assignment) => (
                          <tr key={assignment.id}>
                            <td>
                              <strong className="department-officer-name">{assignment.trainee.fullName}</strong>
                              <span className="department-badge-number">#{assignment.trainee.badge} · {assignment.trainee.rank}</span>
                            </td>
                            <td>{assignment.trainer.fullName} <span className="department-badge-number">#{assignment.trainer.badge}</span></td>
                            <td className="department-mono">{fmtDate(assignment.assignedAt)}</td>
                            <td>
                              <span className={`department-status ${assignment.status === "ACTIVE" ? "department-status-pending" : "department-status-approved"}`}>
                                {assignment.status === "ACTIVE" ? "Đang huấn luyện" : "Hoàn tất"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="department-empty">Chưa có phân công. Tạo phân công mới để bắt đầu theo dõi tiến độ huấn luyện.</div>
                )}
              </section>

              <div className="department-training-forms">
                <section className="department-panel">
                  <header className="department-panel-header">
                    <div>
                      <h3><NotebookPen className="h-4 w-4" /> Nhật ký buổi huấn luyện</h3>
                      <p>Ghi nhận nội dung, diễn biến và kết quả của từng buổi kèm cặp.</p>
                    </div>
                  </header>
                  <form action={createFtoTrainingLog} className="department-form-stack">
                    <label className="department-field">
                      <span>PHÂN CÔNG ĐANG HOẠT ĐỘNG</span>
                      <select name="assignmentId" required defaultValue="" disabled={!activeFtoAssignments.length}>
                        <option value="" disabled>{activeFtoAssignments.length ? "Chọn học viên / FTO" : "Chưa có học viên đang được phân công"}</option>
                        {activeFtoAssignments.map((assignment) => (
                          <option key={assignment.id} value={assignment.id}>
                            {assignment.trainee.fullName} · FTO {assignment.trainer.fullName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="department-inline-fields">
                      <label className="department-field">
                        <span>NGÀY HUẤN LUYỆN</span>
                        <input name="sessionDate" type="date" required defaultValue={`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`} />
                      </label>
                      <label className="department-field">
                        <span>CHỦ ĐỀ</span>
                        <input name="topic" required minLength={3} maxLength={120} placeholder="Tuần tra / radio / quy trình..." />
                      </label>
                    </div>
                    <label className="department-field">
                      <span>NỘI DUNG & KẾT QUẢ</span>
                      <textarea name="notes" required minLength={10} maxLength={3000} rows={4} placeholder="Nội dung đã thực hành, điểm làm tốt, tình huống cần cải thiện..." />
                    </label>
                    <button className="department-form-submit" disabled={!activeFtoAssignments.length}>
                      <NotebookPen className="h-4 w-4" /> Lưu nhật ký buổi học
                    </button>
                  </form>
                </section>

                <section className="department-panel">
                  <header className="department-panel-header">
                    <div>
                      <h3><ClipboardCheck className="h-4 w-4" /> Biểu mẫu đánh giá</h3>
                      <p>Chấm 4 năng lực từ 1–5 và ghi rõ kết luận huấn luyện.</p>
                    </div>
                  </header>
                  <form action={createFtoEvaluation} className="department-form-stack">
                    <label className="department-field">
                      <span>HỌC VIÊN ĐƯỢC ĐÁNH GIÁ</span>
                      <select name="assignmentId" required defaultValue="" disabled={!activeFtoAssignments.length}>
                        <option value="" disabled>{activeFtoAssignments.length ? "Chọn học viên / FTO" : "Chưa có học viên đang được phân công"}</option>
                        {activeFtoAssignments.map((assignment) => (
                          <option key={assignment.id} value={assignment.id}>
                            {assignment.trainee.fullName} · FTO {assignment.trainer.fullName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="department-score-grid">
                      {[
                        ["radioScore", "LIÊN LẠC RADIO"],
                        ["procedureScore", "QUY TRÌNH NGHIỆP VỤ"],
                        ["safetyScore", "AN TOÀN TÁC NGHIỆP"],
                        ["judgmentScore", "PHÁN ĐOÁN TÌNH HUỐNG"],
                      ].map(([name, label]) => (
                        <label key={name} className="department-field">
                          <span>{label}</span>
                          <select name={name} required defaultValue="3">
                            <option value="1">1 · Cần kèm sát</option>
                            <option value="2">2 · Chưa đạt</option>
                            <option value="3">3 · Đạt cơ bản</option>
                            <option value="4">4 · Tốt</option>
                            <option value="5">5 · Thành thạo</option>
                          </select>
                        </label>
                      ))}
                    </div>
                    <label className="department-field">
                      <span>KẾT LUẬN</span>
                      <select name="recommendation" required defaultValue="CONTINUE_TRAINING">
                        <option value="CONTINUE_TRAINING">Tiếp tục huấn luyện</option>
                        <option value="ADDITIONAL_COACHING">Cần huấn luyện bổ sung</option>
                        <option value="READY_FOR_SOLO">Đạt · hoàn tất huấn luyện</option>
                      </select>
                    </label>
                    <label className="department-field">
                      <span>ĐIỂM MẠNH</span>
                      <textarea name="strengths" required minLength={5} maxLength={1500} rows={2} placeholder="Nhận xét năng lực đã thể hiện tốt..." />
                    </label>
                    <label className="department-field">
                      <span>NỘI DUNG CẦN CẢI THIỆN</span>
                      <textarea name="improvementAreas" required minLength={5} maxLength={1500} rows={2} placeholder="Kỹ năng / quy trình cần tiếp tục rèn luyện..." />
                    </label>
                    <button className="department-form-submit" disabled={!activeFtoAssignments.length}>
                      <ClipboardCheck className="h-4 w-4" /> Lưu đánh giá
                    </button>
                    <p className="department-form-hint">Kết luận “Đạt” sẽ đóng phân công; hai kết luận còn lại giữ học viên trong chương trình.</p>
                  </form>
                </section>
              </div>

              <section className="department-panel">
                <header className="department-panel-header">
                  <div>
                    <h3><CalendarClock className="h-4 w-4" /> Lịch sử huấn luyện gần đây</h3>
                    <p>20 nhật ký và đánh giá gần nhất trên toàn đơn vị.</p>
                  </div>
                </header>
                <div className="department-training-history">
                  <section>
                    <h4>NHẬT KÝ BUỔI HỌC</h4>
                    {trainingLogs.length ? trainingLogs.map((log) => (
                      <article key={log.id} className="department-history-item">
                        <span className="department-history-date">{fmtDate(log.sessionDate)}</span>
                        <strong>{log.assignment.trainee.fullName} · {log.topic}</strong>
                        <p>{log.notes}</p>
                        <small>FTO {log.assignment.trainer.fullName} · Ghi bởi {log.author.fullName} #{log.author.badge}</small>
                      </article>
                    )) : <p className="department-history-empty">Chưa có nhật ký huấn luyện.</p>}
                  </section>
                  <section>
                    <h4>ĐÁNH GIÁ NĂNG LỰC</h4>
                    {trainingEvaluations.length ? trainingEvaluations.map((evaluation) => {
                      const average = ((evaluation.radioScore + evaluation.procedureScore + evaluation.safetyScore + evaluation.judgmentScore) / 4).toFixed(1);
                      const recommendation = evaluation.recommendation === "READY_FOR_SOLO"
                        ? "Đạt · Hoàn tất"
                        : evaluation.recommendation === "ADDITIONAL_COACHING"
                          ? "Huấn luyện bổ sung"
                          : "Tiếp tục huấn luyện";
                      return (
                        <article key={evaluation.id} className="department-history-item department-evaluation-item">
                          <span className="department-history-date">{fmtDate(evaluation.evaluatedAt)}</span>
                          <strong>{evaluation.assignment.trainee.fullName} · {average}/5</strong>
                          <span className="department-status department-status-approved">{recommendation}</span>
                          <p><b>Điểm mạnh:</b> {evaluation.strengths}</p>
                          <p><b>Cần cải thiện:</b> {evaluation.improvementAreas}</p>
                          <small>Đánh giá bởi {evaluation.author.fullName} #{evaluation.author.badge}</small>
                        </article>
                      );
                    }) : <p className="department-history-empty">Chưa có biểu mẫu đánh giá.</p>}
                  </section>
                </div>
              </section>

              <section className="department-panel">
                <header className="department-panel-header">
                  <div>
                    <h3><BookOpenCheck className="h-4 w-4" /> Hồ sơ ứng tuyển học viện</h3>
                    <p>Đơn tuyển dụng gần đây · {applicationStatusCounts.PENDING} chờ · {applicationStatusCounts.APPROVED} đã duyệt · {applicationStatusCounts.REJECTED} từ chối trong danh sách.</p>
                  </div>
                </header>
                {applications.length === 0 ? (
                  <div className="department-empty">Chưa có hồ sơ ứng tuyển học viện được ghi nhận.</div>
                ) : (
                  <div className="department-applications">
                    {applications.map((application) => {
                      const status = APPLICATION_STATUS[application.status];
                      return (
                        <article key={application.id} className="department-application">
                          <div className="department-applicant-avatar">
                            {application.fullName.trim().slice(0, 1).toUpperCase()}
                          </div>
                          <div className="department-applicant-content">
                            <div className="department-applicant-title">
                              <div>
                                <h4>{application.fullName}</h4>
                                <span>{application.trackingCode} · IC: {application.fullName} · OC: {application.ocName ?? "Chưa cung cấp"} · {application.age} tuổi{application.gender ? ` · ${application.gender}` : ""} · Discord: {application.discord} · Nộp {fmtDate(application.createdAt)}</span>
                              </div>
                              <span className={`department-status ${status.className}`}>{status.label}</span>
                            </div>
                            <p><strong>Kinh nghiệm lực lượng:</strong> {application.priorService ?? application.experience}</p>
                            {application.roleplayScenario && <p><strong>Tình huống Roleplay:</strong> {application.roleplayScenario}</p>}
                            <p><strong>Lý do gia nhập:</strong> {application.reason}</p>
                            {application.careerGoals && <p><strong>Mục tiêu:</strong> {application.careerGoals}</p>}
                            {application.strengthsWeaknesses && <p><strong>Điểm mạnh / điểm yếu:</strong> {application.strengthsWeaknesses}</p>}
                            {application.activityHours && <p><strong>Khung giờ hoạt động:</strong> {application.activityHours}</p>}
                            {application.minimumDutyHours && <p><strong>Giờ trực tối thiểu:</strong> {application.minimumDutyHours}</p>}
                            {application.ocName && (
                              <div className="mt-2 border-t border-line/60 pt-2">
                                <strong>Cam kết:</strong>
                                <p>Sẵn sàng huấn luyện: {application.trainingCommitment ? "Đồng ý" : "Chưa xác nhận"} · Nội quy NOVARIS: {application.rulesCommitment ? "Đồng ý" : "Chưa xác nhận"}</p>
                                <p>Tác phong: {application.conductCommitment ? "Đồng ý" : "Chưa xác nhận"} · Hoàn thành đào tạo: {application.trainingCompletionCommitment ? "Đồng ý" : "Chưa xác nhận"}</p>
                                <p>Hoạt động tối thiểu / quy định xử lý trong game: {application.earlyDeparturePenaltyCommitment ? "Đã xác nhận" : "Chưa xác nhận"} · Lời cam kết: {application.applicantDeclaration ? "Đã xác nhận" : "Chưa xác nhận"}</p>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
                <footer className="department-notice">
                  <ShieldCheck className="h-4 w-4" />
                  <p>
                    Hồ sơ ứng tuyển dùng cho tuyển dụng; chỉ Cadet đã có tài khoản sĩ quan mới xuất hiện trong danh sách phân công huấn luyện.
                  </p>
                </footer>
              </section>
            </div>

            <aside className="department-panel department-fto-duties">
              <header className="department-panel-header">
                <div>
                  <h3><ShieldCheck className="h-4 w-4" /> Phạm vi công tác FTO</h3>
                  <p>Nhiệm vụ nghiệp vụ của Field Training Officer</p>
                </div>
              </header>
              <ol>
                <li><span>01</span><div><strong>Hướng dẫn thực địa</strong><p>Kèm cặp sĩ quan mới trong quy trình tuần tra, liên lạc vô tuyến và xử lý tình huống.</p></div></li>
                <li><span>02</span><div><strong>Đánh giá năng lực</strong><p>Ghi nhận mức độ tuân thủ quy trình, khả năng phán đoán và tác phong công vụ.</p></div></li>
                <li><span>03</span><div><strong>Báo cáo tiến độ</strong><p>Phản hồi kết quả huấn luyện cho cấp chỉ huy để xem xét phân công và hoàn tất đào tạo.</p></div></li>
              </ol>
              <div className="department-fto-limitation">
                <span><Clock3 className="h-4 w-4" /> QUY TRÌNH ĐÀO TẠO</span>
                <p>Phân công Cadet → ghi nhật ký từng buổi → đánh giá năng lực. Kết luận “Đạt” sẽ hoàn tất chương trình.</p>
              </div>
            </aside>
          </div>
        </section>
      )}
    </div>
  );
}
