import { redirect } from "next/navigation";
import { CalendarDays, ClipboardList } from "lucide-react";
import { Badge, Card, Empty, Field, PageTitle } from "@/components/ui";
import { requireOfficer } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { canManageLeaveRequests } from "@/lib/roles";
import { createLeaveRequest, reviewLeaveRequest } from "../actions";

const labels = { PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Từ chối" } as const;

export default async function LeavePage() {
  const me = await requireOfficer();
  const canReview = canManageLeaveRequests(me.role, me.rank);
  const requests = await db.leaveRequest.findMany({
    where: canReview ? undefined : { officerId: me.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      officer: { select: { fullName: true, badge: true, rank: true } },
      reviewer: { select: { fullName: true, badge: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageTitle tag="PERSONNEL · LEAVE" sub="Gửi yêu cầu vắng mặt để chỉ huy xem xét. Nghỉ phép đã duyệt được ghi nhận là vắng mặt có phép, không tạo khoản trừ hoặc sửa giờ trực.">
        Xin nghỉ phép · LOA
      </PageTitle>
      <Card title="Tạo đơn nghỉ phép" icon={<CalendarDays className="h-4 w-4 text-sky-200" />} subtitle="Chỉ huy hoặc Supervisor duyệt đơn. Thời gian nghỉ tối đa 32 ngày/đơn.">
        <form action={createLeaveRequest} className="grid gap-4 p-4 md:grid-cols-2">
          <Field label="Ngày bắt đầu" required><input className="input" type="date" name="startDate" required /></Field>
          <Field label="Ngày kết thúc" required><input className="input" type="date" name="endDate" required /></Field>
          <div className="md:col-span-2">
            <Field label="Lý do / ghi chú bàn giao" required hint="5–1.000 ký tự">
              <textarea className="input min-h-24" name="reason" minLength={5} maxLength={1000} required />
            </Field>
          </div>
          <div className="md:col-span-2"><button className="btn btn-neon px-4 py-2 text-sm font-semibold">Gửi đơn xin nghỉ</button></div>
        </form>
      </Card>
      <Card title="Đơn nghỉ phép" icon={<ClipboardList className="h-4 w-4 text-sky-200" />} subtitle={canReview ? "Quyền duyệt theo vai trò; nội dung được lưu audit log." : "Bạn chỉ xem được đơn nghỉ của mình."}>
        <div className="space-y-3 p-4">
          {requests.length === 0 ? <Empty>Chưa có đơn nghỉ phép.</Empty> : requests.map((request) => (
            <article key={request.id} className="rounded-lg border border-line bg-panel2/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{request.officer.fullName} · #{request.officer.badge} <span className="font-normal text-slate-400">({request.officer.rank})</span></p>
                  <p className="mt-1 text-sm text-slate-300">{fmtDate(request.startDate)} – {fmtDate(request.endDate)}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-400">{request.reason}</p>
                </div>
                <Badge tone={request.status === "APPROVED" ? "ok" : request.status === "REJECTED" ? "danger" : "warn"}>{labels[request.status]}</Badge>
              </div>
              {request.reviewer && <p className="mt-3 text-xs text-slate-500">Xử lý bởi {request.reviewer.fullName} · #{request.reviewer.badge}{request.reviewNote ? ` — ${request.reviewNote}` : ""}</p>}
              {canReview && request.status === "PENDING" && (
                <div className="mt-4 grid gap-3 border-t border-line/70 pt-4 sm:grid-cols-[1fr_auto_auto]">
                  <form action={reviewLeaveRequest} className="contents">
                    <input type="hidden" name="id" value={request.id} />
                    <input className="input" name="reviewNote" maxLength={1000} placeholder="Ghi chú của người duyệt (không bắt buộc)" />
                    <button className="btn btn-ok px-3 py-2 text-xs font-semibold" name="status" value="APPROVED">Duyệt nghỉ phép</button>
                    <button className="btn btn-danger px-3 py-2 text-xs font-semibold" name="status" value="REJECTED">Từ chối</button>
                  </form>
                </div>
              )}
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}
