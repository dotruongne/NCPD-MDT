import { CarFront, ClipboardPlus, LockKeyhole, TrafficCone } from "lucide-react";
import { Badge, Card, Empty, Field, PageTitle } from "@/components/ui";
import { requireOfficer } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, money } from "@/lib/utils";
import { createImpoundRecord, createTrafficCitation, releaseImpoundRecord } from "../actions";

export default async function TrafficPage() {
  await requireOfficer();
  const [citizens, vehicles, citations, impounds] = await Promise.all([
    db.citizen.findMany({ select: { id: true, fullName: true, citizenId: true }, orderBy: { fullName: "asc" }, take: 500 }),
    db.vehicle.findMany({ select: { id: true, plate: true, model: true, ownerId: true }, orderBy: { plate: "asc" }, take: 500 }),
    db.trafficCitation.findMany({
      take: 40, orderBy: { createdAt: "desc" },
      include: {
        citizen: { select: { fullName: true, citizenId: true } },
        vehicle: { select: { plate: true } },
        officer: { select: { fullName: true, badge: true } },
        fineRecord: { select: { amount: true, paid: true, reason: true } },
      },
    }),
    db.impoundRecord.findMany({
      take: 40, orderBy: { createdAt: "desc" },
      include: { officer: { select: { fullName: true, badge: true } }, vehicle: { select: { plate: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageTitle tag="TRAFFIC ENFORCEMENT" sub="Biên bản phạt nhanh không cần tạo báo cáo vụ việc; hồ sơ tiền phạt được liên kết với sổ thu khi thanh toán.">
        Xử lý giao thông
      </PageTitle>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Lập biên bản phạt nhanh" icon={<TrafficCone className="h-4 w-4 text-amber-300" />} subtitle="Chọn công dân, lỗi, số tiền; có thể liên kết xe đã đăng ký.">
          <form action={createTrafficCitation} className="grid gap-3 p-4">
            <Field label="Công dân" required>
              <select name="citizenId" className="input" required defaultValue="">
                <option value="" disabled>Chọn hồ sơ công dân</option>
                {citizens.map((citizen) => <option key={citizen.id} value={citizen.id}>{citizen.fullName} · {citizen.citizenId}</option>)}
              </select>
            </Field>
            <Field label="Phương tiện (không bắt buộc)">
              <select name="vehicleId" className="input" defaultValue="">
                <option value="">Không liên kết xe</option>
                {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} · {vehicle.model}</option>)}
              </select>
            </Field>
            <Field label="Lỗi vi phạm" required><textarea name="reason" className="input min-h-20" minLength={5} maxLength={500} required /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Số tiền phạt ($)" required><input name="amount" className="input" type="number" min={1} max={1000000000} step={1} required /></Field>
              <Field label="Địa điểm"><input name="location" className="input" maxLength={160} /></Field>
            </div>
            <button className="btn btn-neon mt-1 px-4 py-2 text-sm font-semibold">Lập biên bản phạt</button>
          </form>
        </Card>
        <Card title="Lập hồ sơ tạm giữ xe" icon={<LockKeyhole className="h-4 w-4 text-red-300" />} subtitle="Ghi nhận biển số, lý do và phí lấy xe; đóng hồ sơ khi xe được giải phóng.">
          <form action={createImpoundRecord} className="grid gap-3 p-4">
            <Field label="Xe đăng ký (không bắt buộc)">
              <select name="vehicleId" className="input" defaultValue="">
                <option value="">Nhập biển số thủ công</option>
                {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} · {vehicle.model}</option>)}
              </select>
            </Field>
            <Field label="Biển số" hint="Bỏ trống nếu chọn xe ở trên"><input name="plate" className="input font-mono uppercase" maxLength={20} /></Field>
            <Field label="Lý do tạm giữ" required><textarea name="reason" className="input min-h-20" minLength={5} maxLength={1000} required /></Field>
            <Field label="Phí lấy xe ($)" required><input name="retrievalFee" className="input" type="number" min={0} max={1000000000} step={1} required /></Field>
            <button className="btn btn-danger mt-1 px-4 py-2 text-sm font-semibold">Ghi nhận tạm giữ</button>
          </form>
        </Card>
      </div>
      <Card title="Biên bản phạt gần đây" icon={<ClipboardPlus className="h-4 w-4 text-sky-200" />}>
        <div className="divide-y divide-line/60 px-4">
          {citations.length === 0 ? <Empty className="my-4">Chưa có biên bản phạt giao thông.</Empty> : citations.map((citation) => (
            <div key={citation.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">TR-{String(citation.citationNo).padStart(5, "0")}</span>
                  <Badge tone={citation.fineRecord.paid ? "ok" : "warn"}>{citation.fineRecord.paid ? "Đã nộp" : "Chưa nộp"}</Badge>
                </div>
                <p className="mt-1 font-semibold text-white">{citation.citizen.fullName} · {citation.vehicle?.plate ?? "Không liên kết xe"}</p>
                <p className="mt-1 text-sm text-slate-400">{citation.fineRecord.reason} · {citation.location ?? "Không ghi địa điểm"}</p>
                <p className="mt-1 text-xs text-slate-500">Lập bởi {citation.officer.fullName} · #{citation.officer.badge} · {fmtDate(citation.createdAt)}</p>
              </div>
              <span className="font-mono text-sm font-semibold text-amber-200">{money(citation.fineRecord.amount)}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Sổ tạm giữ phương tiện" icon={<CarFront className="h-4 w-4 text-red-300" />}>
        <div className="divide-y divide-line/60 px-4">
          {impounds.length === 0 ? <Empty className="my-4">Chưa có phương tiện bị tạm giữ.</Empty> : impounds.map((impound) => (
            <div key={impound.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-white">{impound.vehicle?.plate ?? impound.plate}</span>
                  <Badge tone={impound.status === "IMPOUNDED" ? "danger" : "ok"}>{impound.status === "IMPOUNDED" ? "Đang tạm giữ" : "Đã giải phóng"}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-400">{impound.reason} · Phí lấy xe {money(impound.retrievalFee)}</p>
                <p className="mt-1 text-xs text-slate-500">Ghi nhận bởi {impound.officer.fullName} · #{impound.officer.badge} · {fmtDate(impound.createdAt)}</p>
              </div>
              {impound.status === "IMPOUNDED" && (
                <form action={releaseImpoundRecord} className="flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={impound.id} />
                  <input name="releaseNote" className="input w-52 py-1.5 text-xs" maxLength={500} placeholder="Ghi chú giải phóng xe" />
                  <button className="btn btn-ok px-3 py-1.5 text-xs font-semibold">Giải phóng xe</button>
                </form>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
