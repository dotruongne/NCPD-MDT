import { redirect } from "next/navigation";
import { ScrollText } from "lucide-react";
import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { hasPersonnelManagement } from "@/lib/roles";
import { Badge, Card, Empty, PageTitle } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export default async function AuditPage() {
  const me = await requireOfficer();
  if (!hasPersonnelManagement(me.role, me.rank)) redirect("/mdt");

  const entries = await db.auditLog.findMany({
    take: 200,
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { fullName: true, badge: true, rank: true } } },
  });

  return (
    <div className="space-y-6">
      <PageTitle tag="COMMAND AUDIT" sub="Nhật ký bất biến ghi lại thao tác thay đổi hồ sơ Nội vụ, tài khoản và các chức năng đã tích hợp. Chỉ Ban Chỉ huy được xem.">
        Nhật ký thao tác
      </PageTitle>
      <Card
        title={`Hoạt động gần đây (${entries.length})`}
        icon={<ScrollText className="h-4 w-4 text-sky-200" />}
        subtitle="Hiển thị tối đa 200 sự kiện mới nhất. Nhật ký không có chức năng sửa hoặc xóa."
      >
        <div className="divide-y divide-line/60 px-4">
          {entries.length === 0 ? (
            <Empty className="my-4">Chưa có sự kiện được ghi nhận.</Empty>
          ) : entries.map((entry) => (
            <div key={entry.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={entry.action === "DELETE" ? "danger" : entry.action === "UPDATE" ? "warn" : "info"}>
                    {entry.action}
                  </Badge>
                  <span className="font-mono text-xs text-slate-400">{entry.entityType} · {entry.entityId}</span>
                </div>
                <p className="mt-1 text-sm text-slate-200">{entry.summary}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {entry.actor.fullName} · #{entry.actor.badge} · {entry.actor.rank}
                </p>
              </div>
              <time className="shrink-0 text-xs text-slate-500">{fmtDate(entry.createdAt)}</time>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
