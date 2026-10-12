import { redirect } from "next/navigation";
import { Award, BadgeCheck } from "lucide-react";
import { Badge, Card, Empty, Field, PageTitle } from "@/components/ui";
import { requireOfficer } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasFtoAccess } from "@/lib/roles";
import { fmtDate } from "@/lib/utils";
import { issueOfficerCertificate, updateOfficerCertificateStatus } from "../../../actions";

const statusLabel = { ACTIVE: "Có hiệu lực", SUSPENDED: "Tạm đình chỉ", REVOKED: "Thu hồi" } as const;

export default async function CertificatesPage() {
  const me = await requireOfficer();
  if (!hasFtoAccess(me.role, me.rank)) redirect("/mdt");
  const [officers, certificates] = await Promise.all([
    db.officer.findMany({ where: { active: true }, select: { id: true, fullName: true, badge: true }, orderBy: { badge: "asc" } }),
    db.officerCertificate.findMany({
      take: 100,
      orderBy: { issuedAt: "desc" },
      include: { officer: { select: { fullName: true, badge: true, rank: true } }, issuer: { select: { fullName: true, badge: true } } },
    }),
  ]);
  return (
    <div className="space-y-6">
      <PageTitle tag="FTO · CREDENTIALS" sub="FTO, High Command hoặc Deputy Chief có thể cấp, đình chỉ và thu hồi chứng chỉ đào tạo của sĩ quan.">
        Chứng chỉ sĩ quan
      </PageTitle>
      <Card title="Cấp chứng chỉ" icon={<Award className="h-4 w-4 text-amber-300" />}>
        <form action={issueOfficerCertificate} className="grid gap-4 p-4 md:grid-cols-2">
          <Field label="Sĩ quan nhận chứng chỉ" required>
            <select className="input" name="officerId" required defaultValue="">
              <option value="" disabled>Chọn sĩ quan</option>
              {officers.map((officer) => <option key={officer.id} value={officer.id}>{officer.fullName} · #{officer.badge}</option>)}
            </select>
          </Field>
          <Field label="Tên chứng chỉ" required><input className="input" name="title" minLength={3} maxLength={120} required placeholder="Ví dụ: Defensive Driving" /></Field>
          <Field label="Ngày hết hạn"><input className="input" type="date" name="expiresOn" /></Field>
          <Field label="Ghi chú"><input className="input" name="description" maxLength={1000} /></Field>
          <div className="md:col-span-2"><button className="btn btn-neon px-4 py-2 text-sm font-semibold">Cấp chứng chỉ</button></div>
        </form>
      </Card>
      <Card title={`Sổ chứng chỉ (${certificates.length})`} icon={<BadgeCheck className="h-4 w-4 text-emerald-300" />}>
        <div className="divide-y divide-line/60 px-4">
          {certificates.length === 0 ? <Empty className="my-4">Chưa có chứng chỉ được cấp.</Empty> : certificates.map((certificate) => (
            <div key={certificate.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">CERT-{String(certificate.certificateNo).padStart(5, "0")}</span>
                  <Badge tone={certificate.status === "ACTIVE" ? "ok" : certificate.status === "SUSPENDED" ? "warn" : "danger"}>{statusLabel[certificate.status]}</Badge>
                </div>
                <p className="mt-1 font-semibold text-white">{certificate.title} · {certificate.officer.fullName} (#{certificate.officer.badge})</p>
                {certificate.description && <p className="mt-1 text-sm text-slate-400">{certificate.description}</p>}
                <p className="mt-1 text-xs text-slate-500">Cấp bởi {certificate.issuer.fullName} · #{certificate.issuer.badge} · {fmtDate(certificate.issuedAt)}{certificate.expiresAt ? ` · Hết hạn ${fmtDate(certificate.expiresAt)}` : ""}</p>
              </div>
              <form action={updateOfficerCertificateStatus} className="flex items-center gap-2">
                <input type="hidden" name="id" value={certificate.id} />
                <select className="input py-1.5 text-xs" name="status" defaultValue={certificate.status} aria-label={`Trạng thái ${certificate.title}`}>
                  <option value="ACTIVE">Có hiệu lực</option>
                  <option value="SUSPENDED">Tạm đình chỉ</option>
                  <option value="REVOKED">Thu hồi</option>
                </select>
                <button className="btn px-3 py-1.5 text-xs font-semibold">Cập nhật</button>
              </form>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
