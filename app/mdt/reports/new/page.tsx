import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import { ReportBuilder } from "@/components/report-builder";

export default async function NewReport({ searchParams }: { searchParams: { suspect?: string } }) {
  const me = await requireOfficer();
  const [charges, citizens] = await Promise.all([
    db.charge.findMany({ where: { active: true }, orderBy: [{ category: "asc" }, { code: "asc" }] }),
    db.citizen.findMany({ select: { id: true, fullName: true, citizenId: true }, orderBy: { fullName: "asc" }, take: 1000 }),
  ]);
  return (
    <div className="report-builder-page">
      <section className="report-hero report-builder-hero">
        <div className="report-hero-copy">
          <div className="report-kicker">
            <FileText className="h-4 w-4" />
            <span>NCPD · BIỂU MẪU NGHIỆP VỤ</span>
            <span className="report-live"><i /> BẢN NHÁP TỰ LƯU</span>
          </div>
          <h1 className="report-title">Lập báo cáo vụ việc</h1>
          <p className="report-description">
            Hoàn thiện thông tin sự việc, liên kết hồ sơ công dân và ghi nhận các quyết định xử lý.
          </p>
        </div>
        <div className="report-builder-officer">
          <ShieldCheck className="h-5 w-5" />
          <div>
            <span>SĨ QUAN LẬP HỒ SƠ</span>
            <strong>{me.fullName}</strong>
            <small>{me.rank} · #{me.badge}{me.callsign ? ` · ${me.callsign}` : ""}</small>
          </div>
        </div>
      </section>
      <Link href="/mdt/reports" className="report-back-link">
        <ArrowLeft className="h-4 w-4" /> Quay lại sổ vụ việc
      </Link>
      <ReportBuilder
        charges={charges}
        citizens={citizens}
        presetSuspect={searchParams.suspect}
        officer={{ fullName: me.fullName, rank: me.rank, badge: me.badge, callsign: me.callsign }}
      />
    </div>
  );
}
