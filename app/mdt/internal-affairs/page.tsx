import { redirect } from "next/navigation";
import { AlertTriangle, ClipboardCheck, ShieldAlert } from "lucide-react";
import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { hasPersonnelManagement } from "@/lib/roles";
import { Badge, Card, Empty, Field, PageTitle } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { createInternalAffairsCase, updateInternalAffairsCase } from "../actions";

const statusText = {
  OPEN: "Mới tiếp nhận",
  INVESTIGATING: "Đang điều tra",
  CLOSED: "Đã kết thúc",
} as const;

export default async function InternalAffairsPage() {
  const me = await requireOfficer();
  if (!hasPersonnelManagement(me.role, me.rank)) redirect("/mdt");

  const [officers, cases] = await Promise.all([
    db.officer.findMany({
      where: { active: true },
      select: { id: true, fullName: true, badge: true, rank: true },
      orderBy: { badge: "asc" },
    }),
    db.internalAffairsCase.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        subject: { select: { fullName: true, badge: true, rank: true } },
        author: { select: { fullName: true, badge: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageTitle tag="COMMAND CONFIDENTIAL" sub="Hồ sơ khiếu nại và kỷ luật — chỉ Ban Chỉ huy được xem. Hồ sơ đã tạo không thể xóa khỏi hệ thống.">
        Nội vụ · Internal Affairs
      </PageTitle>

      <Card
        title="Tiếp nhận hồ sơ nội vụ"
        icon={<ShieldAlert className="h-4 w-4 text-amber-300" />}
        subtitle="Chỉ ghi nhận thông tin cần thiết cho quá trình xác minh. Mọi thao tác được lưu vào audit log."
      >
        <form action={createInternalAffairsCase} className="grid gap-4 p-4 md:grid-cols-2">
          <Field label="Sĩ quan liên quan" required>
            <select className="input" name="subjectId" required defaultValue="">
              <option value="" disabled>Chọn sĩ quan</option>
              {officers.map((officer) => (
                <option key={officer.id} value={officer.id}>
                  {officer.badge} · {officer.fullName} — {officer.rank}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Loại hồ sơ" required>
            <select className="input" name="category" required defaultValue="">
              <option value="" disabled>Chọn phân loại</option>
              <option>Khiếu nại</option>
              <option>Vi phạm quy trình</option>
              <option>Kỷ luật</option>
              <option>Ứng xử / đạo đức công vụ</option>
              <option>Khác</option>
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Tóm tắt" required hint="5–180 ký tự">
              <input className="input" name="summary" minLength={5} maxLength={180} required />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Nội dung và thông tin xác minh" required hint="20–5.000 ký tự">
              <textarea className="input min-h-32" name="details" minLength={20} maxLength={5000} required />
            </Field>
          </div>
          <div className="md:col-span-2">
            <button className="btn btn-neon px-4 py-2 text-sm font-semibold">Tạo hồ sơ IA</button>
          </div>
        </form>
      </Card>

      <Card
        title={`Hồ sơ nội vụ gần đây (${cases.length})`}
        icon={<ClipboardCheck className="h-4 w-4 text-sky-200" />}
        subtitle="Danh sách giới hạn 100 hồ sơ gần nhất. Trạng thái và kết luận được lưu kèm nhật ký thao tác."
      >
        <div className="space-y-3 p-4">
          {cases.length === 0 ? (
            <Empty icon={<AlertTriangle className="h-7 w-7" />}>Chưa có hồ sơ nội vụ.</Empty>
          ) : cases.map((item) => (
            <article key={item.id} className="rounded-lg border border-line bg-panel2/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">IA-{String(item.caseNumber).padStart(4, "0")}</span>
                    <Badge tone={item.status === "CLOSED" ? "neutral" : item.status === "INVESTIGATING" ? "warn" : "danger"}>
                      {statusText[item.status]}
                    </Badge>
                    <Badge tone="info">{item.category}</Badge>
                  </div>
                  <h2 className="mt-2 font-semibold text-white">{item.summary}</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Liên quan: {item.subject.fullName} · #{item.subject.badge} · {item.subject.rank}
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  Mở {fmtDate(item.createdAt)} bởi {item.author.fullName} · #{item.author.badge}
                </p>
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-sky-200">Xem nội dung hồ sơ</summary>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{item.details}</p>
              </details>
              <form action={updateInternalAffairsCase} className="mt-4 grid gap-3 border-t border-line/70 pt-4 md:grid-cols-[180px_1fr_auto]">
                <input type="hidden" name="id" value={item.id} />
                <select className="input" name="status" defaultValue={item.status} aria-label={`Trạng thái hồ sơ IA-${item.caseNumber}`}>
                  <option value="OPEN">Mới tiếp nhận</option>
                  <option value="INVESTIGATING">Đang điều tra</option>
                  <option value="CLOSED">Đã kết thúc</option>
                </select>
                <input className="input" name="resolution" defaultValue={item.resolution ?? ""} maxLength={3000} placeholder="Kết luận / ghi chú xử lý (tối đa 3.000 ký tự)" />
                <button className="btn px-4 py-2 text-xs font-semibold">Lưu cập nhật</button>
              </form>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}
