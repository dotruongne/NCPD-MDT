import Link from "next/link";
import {
  ArrowUpRight,
  BadgeAlert,
  FilePlus2,
  FileText,
  MapPin,
  Scale,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { db } from "@/lib/db";
import { fmtDate, money } from "@/lib/utils";

export default async function ReportsPage() {
  const list = await db.incident.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: { select: { fullName: true, badge: true } },
      suspect: { select: { id: true, fullName: true, citizenId: true } },
      charges: { include: { charge: { select: { code: true, title: true } } } },
    },
  });

  return (
    <div className="mdt-reports">
      <section className="report-hero">
        <div className="report-hero-copy">
          <div className="report-kicker">
            <FileText className="h-4 w-4" />
            <span>NCPD · HỆ THỐNG HỒ SƠ SỐ</span>
            <span className="report-live"><i /> HỒ SƠ NGHIỆP VỤ</span>
          </div>
          <h1 className="report-title">Báo cáo vụ việc</h1>
          <p className="report-description">
            Quản lý tường trình, đối tượng liên quan và quyết định xử lý trong một hồ sơ thống nhất.
          </p>
        </div>
        <div className="report-hero-action">
          <div className="report-record-type">
            <ShieldCheck className="h-5 w-5" />
            <div>
              <span>PHÂN HỆ HIỆN TẠI</span>
              <strong>Hồ sơ vụ việc</strong>
            </div>
          </div>
          <Link href="/mdt/reports/new" className="report-create-button">
            <FilePlus2 className="h-4 w-4" />
            <span>Lập báo cáo mới</span>
            <ArrowUpRight className="report-button-arrow h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="report-records" aria-label="Danh sách báo cáo vụ việc">
        <header className="report-records-header">
          <div className="report-records-heading">
            <span className="report-icon-box"><FileText className="h-4 w-4" /></span>
            <div>
              <p className="report-section-eyebrow">CASE REGISTER</p>
              <h2>Sổ đăng ký vụ việc</h2>
              <p className="report-section-description">50 hồ sơ gần nhất được ghi nhận trên toàn hệ thống</p>
            </div>
          </div>
          <div className="report-count">
            <strong>{list.length.toString().padStart(2, "0")}</strong>
            <span>HỒ SƠ</span>
          </div>
        </header>

        {list.length === 0 ? (
          <div className="report-empty">
            <span className="report-empty-icon"><FileText className="h-6 w-6" /></span>
            <h3>Chưa có báo cáo vụ việc</h3>
            <p>Các báo cáo đã lưu sẽ được lưu trữ tại đây để thuận tiện tra cứu và theo dõi.</p>
            <Link href="/mdt/reports/new" className="report-empty-link">
              <FilePlus2 className="h-4 w-4" /> Tạo báo cáo đầu tiên
            </Link>
          </div>
        ) : (
          <div className="report-table-scroll">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Mã hồ sơ</th>
                  <th>Vụ việc / Sĩ quan</th>
                  <th>Đối tượng</th>
                  <th>Tội danh áp dụng</th>
                  <th className="report-align-right">Tiền phạt</th>
                  <th className="report-align-right">Án tù</th>
                </tr>
              </thead>
              <tbody>
                {list.map((incident) => (
                  <tr key={incident.id}>
                    <td>
                      <span className="report-number">#{incident.number}</span>
                      <span className="report-date">{fmtDate(incident.createdAt)}</span>
                    </td>
                    <td>
                      <div className="report-case-title">{incident.title}</div>
                      <div className="report-officer">
                        <ShieldCheck className="h-3 w-3" />
                        {incident.author.fullName}
                        <span>· #{incident.author.badge}</span>
                      </div>
                    </td>
                    <td>
                      {incident.suspect ? (
                        <Link
                          href={`/mdt/database/citizens/${incident.suspect.id}`}
                          className="report-suspect-link"
                        >
                          <span className="report-suspect-avatar">
                            {incident.suspect.fullName.trim().slice(0, 1).toUpperCase()}
                          </span>
                          <span className="report-suspect-details">
                            <strong>{incident.suspect.fullName}</strong>
                            <small>{incident.suspect.citizenId}</small>
                          </span>
                          <ArrowUpRight className="report-suspect-arrow h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <div className="report-suspect-unknown">
                          <UserRound className="h-4 w-4" />
                          <span>{incident.suspectName ?? "Không rõ đối tượng"}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      {incident.charges.length ? (
                        <div className="report-charges">
                          {incident.charges.slice(0, 3).map((item) => (
                            <span
                              key={item.id}
                              className="report-charge"
                              title={`${item.charge.title}${item.count > 1 ? ` ×${item.count}` : ""}`}
                            >
                              {item.charge.code}
                              {item.count > 1 && <b>×{item.count}</b>}
                            </span>
                          ))}
                          {incident.charges.length > 3 && (
                            <span className="report-charge-more">+{incident.charges.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="report-no-charge">Chưa ghi nhận</span>
                      )}
                    </td>
                    <td className="report-align-right">
                      <span className="report-fine">{money(incident.totalFine)}</span>
                    </td>
                    <td className="report-align-right">
                      <span className="report-jail"><Scale className="h-3.5 w-3.5" />{incident.totalJail} phút</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="report-records-footer">
          <span><i /> HỆ THỐNG HỒ SƠ NỘI BỘ NCPD</span>
          <span><BadgeAlert className="h-3 w-3" /> Chỉ sử dụng cho mục đích nghiệp vụ</span>
          <span><MapPin className="h-3 w-3" /> Tối đa 50 hồ sơ gần nhất</span>
        </footer>
      </section>
    </div>
  );
}
