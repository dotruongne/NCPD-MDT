import {
  AlertTriangle,
  Ambulance,
  Car,
  Check,
  Clock3,
  MapPin,
  Radio,
  Siren,
  UserRound,
  Users,
} from "lucide-react";
import { Badge, Card, Empty, Field, PageTitle } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { assignDispatchUnits, createDispatchCall, updateDispatchCallStatus } from "../actions";

const PRIORITIES = {
  LOW: { label: "Thấp", tone: "info" as const },
  MEDIUM: { label: "Trung bình", tone: "warn" as const },
  HIGH: { label: "Cao", tone: "danger" as const },
  URGENT: { label: "Khẩn cấp", tone: "danger" as const },
};

const STATUSES = {
  PENDING: { label: "Chờ điều phối", tone: "warn" as const },
  DISPATCHED: { label: "Đã phân công", tone: "info" as const },
  ON_SCENE: { label: "Đã tới hiện trường", tone: "ok" as const },
  CLEARED: { label: "Đã xử lý", tone: "neutral" as const },
  CANCELLED: { label: "Đã hủy", tone: "neutral" as const },
};

const STATUS_OPTIONS = [
  ["DISPATCHED", "Đã phân công đơn vị"],
  ["ON_SCENE", "Đã tới hiện trường"],
  ["CLEARED", "Đóng cuộc gọi"],
  ["CANCELLED", "Hủy cuộc gọi"],
] as const;

const CATEGORY_ICONS: Record<string, typeof Radio> = {
  "Traffic Stop": Car,
  "Traffic Collision": Car,
  "Medical Assistance": Ambulance,
  "Officer Needs Assistance": Siren,
};

export default async function DispatchPage() {
  const me = await requireOfficer();
  const canDispatch = me.role !== "OFFICER";
  const [calls, availableUnits] = await Promise.all([
    db.dispatchCall.findMany({
      take: 60,
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
      include: {
        reporter: { select: { fullName: true, badge: true, callsign: true } },
        assignments: {
          include: {
            officer: { select: { id: true, fullName: true, badge: true, callsign: true, rank: true, onDuty: true } },
          },
          orderBy: { assignedAt: "asc" },
        },
      },
    }),
    db.officer.findMany({
      where: { active: true, onDuty: true },
      select: { id: true, fullName: true, badge: true, callsign: true, rank: true },
      orderBy: { callsign: "asc" },
    }),
  ]);
  const activeCalls = calls.filter((call) => call.status !== "CLEARED" && call.status !== "CANCELLED");
  const closedCalls = calls.filter((call) => call.status === "CLEARED" || call.status === "CANCELLED");

  return (
    <div className="space-y-6">
      <PageTitle
        tag="DISPATCH · ACTIVE CALLS"
        sub="Tiếp nhận yêu cầu hỗ trợ, theo dõi tình huống và điều phối đơn vị đang On-Duty."
      >
        Dispatch & Cuộc gọi
      </PageTitle>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4" title="Cuộc gọi đang mở" icon={<Radio className="h-4 w-4" />}>
          <p className="font-mono text-2xl font-semibold text-sky-300">{activeCalls.length}</p>
          <p className="mt-1 text-xs text-slate-500">Chưa được đóng</p>
        </Card>
        <Card className="p-4" title="Chờ điều phối" icon={<Clock3 className="h-4 w-4" />}>
          <p className="font-mono text-2xl font-semibold text-amber-300">
            {activeCalls.filter((call) => call.status === "PENDING").length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Cần phân công đơn vị</p>
        </Card>
        <Card className="p-4" title="Đơn vị sẵn sàng" icon={<Users className="h-4 w-4" />}>
          <p className="font-mono text-2xl font-semibold text-emerald-300">{availableUnits.length}</p>
          <p className="mt-1 text-xs text-slate-500">Sĩ quan Active và On-Duty</p>
        </Card>
      </div>

      <Card
        title="Tạo cuộc gọi mới"
        icon={<Siren className="h-4 w-4" />}
        subtitle="Ghi nhận tình huống để Dispatcher theo dõi và điều phối."
      >
        <form action={createDispatchCall} className="grid gap-4 md:grid-cols-2">
          <Field label="Tiêu đề / sự việc *" required>
            <input name="title" className="input" maxLength={120} placeholder="VD: Va chạm giao thông nhiều phương tiện" required />
          </Field>
          <Field label="Địa điểm *" required>
            <input name="location" className="input" maxLength={160} placeholder="VD: Alta St giao Vespucci Blvd" required />
          </Field>
          <Field label="Loại cuộc gọi">
            <select name="category" className="input" defaultValue="Other">
              <option value="Traffic Stop">Traffic Stop</option>
              <option value="Traffic Collision">Traffic Collision</option>
              <option value="Medical Assistance">Medical Assistance</option>
              <option value="Disturbance">Disturbance</option>
              <option value="Robbery">Robbery</option>
              <option value="Weapons Call">Weapons Call</option>
              <option value="Officer Needs Assistance">Officer Needs Assistance</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Mức ưu tiên">
            <select name="priority" className="input" defaultValue="MEDIUM">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </Field>
          <Field label="Người gọi">
            <input name="callerName" className="input" maxLength={100} placeholder="Không bắt buộc" />
          </Field>
          <Field label="Số liên lạc">
            <input name="callerPhone" className="input" maxLength={40} placeholder="Không bắt buộc" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Thông tin ban đầu *" required>
              <textarea name="details" className="input" rows={3} maxLength={4000} placeholder="Mô tả tình huống, số người liên quan, nguy cơ hoặc hỗ trợ cần thiết..." required />
            </Field>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button className="btn btn-neon px-4 py-2">
              <Radio className="h-4 w-4" /> Ghi nhận cuộc gọi
            </button>
          </div>
        </form>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Active calls</h2>
          <span className="font-mono text-xs text-slate-500">{activeCalls.length} ĐANG MỞ</span>
        </div>
        {activeCalls.length === 0 ? (
          <Empty icon={<Check className="h-7 w-7 text-emerald-400" />}>Không có cuộc gọi nào đang mở.</Empty>
        ) : (
          <div className="space-y-3">
            {activeCalls.map((call) => {
              const CategoryIcon = CATEGORY_ICONS[call.category] ?? AlertTriangle;
              return (
                <Card key={call.id} className="p-4 md:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-sky-300">
                        <CategoryIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-sky-300">#{String(call.callNumber).padStart(4, "0")}</span>
                          <Badge tone={PRIORITIES[call.priority].tone}>{PRIORITIES[call.priority].label}</Badge>
                          <Badge tone={STATUSES[call.status].tone} dot>{STATUSES[call.status].label}</Badge>
                        </div>
                        <h3 className="mt-1.5 text-sm font-semibold text-white">{call.title}</h3>
                        <p className="mt-1 text-xs text-slate-400">{call.category}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500">{fmtDate(call.createdAt)}</span>
                  </div>

                  <div className="mt-4 grid gap-3 border-t border-line pt-3 text-xs sm:grid-cols-2">
                    <p className="flex items-center gap-2 text-slate-300">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" /> {call.location}
                    </p>
                    <p className="flex items-center gap-2 text-slate-400">
                      <UserRound className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      {call.callerName || "Caller unknown"}{call.callerPhone ? ` · ${call.callerPhone}` : ""}
                    </p>
                    <p className="leading-relaxed text-slate-300 sm:col-span-2">{call.details}</p>
                    <p className="text-slate-500 sm:col-span-2">
                      Logged by {call.reporter.callsign || `${call.reporter.fullName} #${call.reporter.badge}`}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-line pt-3">
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Assigned units</p>
                    {call.assignments.length ? (
                      <div className="flex flex-wrap gap-2">
                        {call.assignments.map(({ officer }) => (
                          <Badge key={officer.id} tone={officer.onDuty ? "ok" : "neutral"}>
                            {officer.callsign || `${officer.fullName} #${officer.badge}`}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">Chưa điều phối đơn vị.</p>
                    )}
                  </div>

                  {canDispatch && (
                    <div className="mt-4 grid gap-4 border-t border-line pt-4 lg:grid-cols-2">
                      <form action={assignDispatchUnits} className="space-y-2">
                        <input type="hidden" name="callId" value={call.id} />
                        <label className="label">Điều phối đơn vị đang On-Duty</label>
                        {availableUnits.length ? (
                          <>
                            <select name="officerIds" multiple size={Math.min(availableUnits.length, 4)} defaultValue={call.assignments.filter((item) => item.officer.onDuty).map((item) => item.officer.id)} className="input min-h-24">
                              {availableUnits.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                  {unit.callsign || `#${unit.badge}`} · {unit.fullName} · {unit.rank}
                                </option>
                              ))}
                            </select>
                            <p className="text-[10px] text-slate-500">Giữ Ctrl (Windows) hoặc ⌘ (Mac) để chọn nhiều đơn vị.</p>
                          </>
                        ) : (
                          <p className="rounded-lg border border-line p-3 text-xs text-slate-500">Không có sĩ quan On-Duty để điều phối.</p>
                        )}
                        <button className="btn btn-neon text-xs">Lưu phân công</button>
                      </form>

                      <form action={updateDispatchCallStatus} className="space-y-2">
                        <input type="hidden" name="callId" value={call.id} />
                        <label className="label" htmlFor={`call-status-${call.id}`}>Cập nhật tiến độ</label>
                        <select id={`call-status-${call.id}`} name="status" className="input">
                          {STATUS_OPTIONS.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <button className="btn text-xs">Cập nhật trạng thái</button>
                      </form>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {closedCalls.length > 0 && (
        <Card title={`Recent closed calls (${closedCalls.length})`} icon={<Check className="h-4 w-4" />}>
          <div className="divide-y divide-line/60">
            {closedCalls.slice(0, 12).map((call) => (
              <div key={call.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    <span className="mr-2 font-mono text-xs text-slate-500">#{String(call.callNumber).padStart(4, "0")}</span>
                    {call.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{call.location} · {fmtDate(call.updatedAt)}</p>
                </div>
                <Badge tone={STATUSES[call.status].tone}>{STATUSES[call.status].label}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
