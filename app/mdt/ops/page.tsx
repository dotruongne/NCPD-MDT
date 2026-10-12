import { Radio, Siren, Crosshair, AlertTriangle, ShieldCheck, XCircle, Trash2, Plus, DollarSign } from "lucide-react";
import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { Badge, Card, Empty, Field, PageTitle, PlateBadge } from "@/components/ui";
import { fmtDate, money } from "@/lib/utils";
import { closeBolo, createBolo, createWarrant, deleteWarrant, setWarrantStatus } from "../actions";

const DANGER = {
  LOW: { label: "Thấp", tone: "info" as const },
  MEDIUM: { label: "Trung bình", tone: "warn" as const },
  HIGH: { label: "Nguy hiểm", tone: "danger" as const },
  EXTREME: { label: "Cực kỳ nguy hiểm", tone: "danger" as const },
};

const WSTATUS = {
  ACTIVE: { label: "Hiệu lực", tone: "danger" as const, dot: true },
  SERVED: { label: "Đã thi hành", tone: "ok" as const, dot: false },
  CANCELLED: { label: "Đã hủy", tone: "neutral" as const, dot: false },
};

export default async function OpsPage() {
  const me = await requireOfficer();
  const canWarrant = me.role !== "OFFICER";
  const [bolos, warrants, citizens] = await Promise.all([
    db.bolo.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { fullName: true, callsign: true } } },
    }),
    db.warrant.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 60,
      include: { author: { select: { fullName: true } } },
    }),
    db.citizen.findMany({
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
      take: 500,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageTitle
        tag="TACTICAL OPERATIONS"
        sub="Quản lý thông báo khẩn cấp BOLO và ban hành lệnh truy nã tư pháp cho toàn thành phố."
      >
        Tác chiến & Truy nã
      </PageTitle>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: BOLOs */}
        <div className="space-y-6">
          <Card
            title="Phát BOLO khẩn cấp"
            icon={<Siren className="h-4 w-4 text-danger animate-pulse" />}
            subtitle="Phát tín hiệu truy tìm xe hoặc đối tượng trên toàn kênh Radio"
            tone="danger"
          >
            <form action={createBolo} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Loại BOLO">
                  <select name="kind" className="input">
                    <option value="Xe">Xe cộ</option>
                    <option value="Đối tượng">Đối tượng</option>
                  </select>
                </Field>
                <div className="col-span-2">
                  <Field label="Biển số (nếu có)">
                    <input
                      name="plate"
                      placeholder="VD: 88XYZ123"
                      className="input font-mono uppercase"
                    />
                  </Field>
                </div>
              </div>
              <Field label="Đặc điểm nhận dạng / Mô tả chi tiết *" required>
                <textarea
                  name="description"
                  rows={2}
                  className="input"
                  placeholder="Sultan đen kính đen, 2 đối tượng bịt mặt, vừa nổ súng tại Legion Square..."
                  required
                />
              </Field>
              <Field label="Vị trí thấy lần cuối / Hướng tẩu thoát">
                <input
                  name="lastSeen"
                  className="input"
                  placeholder="VD: Vinewood Blvd chạy về hướng Đại lộ Senora"
                />
              </Field>
              <button className="btn btn-danger w-full py-2.5 font-mono text-xs font-bold tracking-wider shadow-danger">
                PHÁT LỆNH BOLO TOÀN KÊNH
              </button>
            </form>
          </Card>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Radio className="h-4 w-4 text-neon" />
                <span>BOLO Đang hiệu lực ({bolos.length})</span>
              </h3>
            </div>

            {bolos.length === 0 ? (
              <Empty>Hiện không có BOLO nào đang hoạt động.</Empty>
            ) : (
              bolos.map((b) => (
                <Card key={b.id} tone="danger" className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge tone="danger" dot>
                          {b.kind}
                        </Badge>
                        {b.plate && <PlateBadge plate={b.plate} />}
                      </div>
                      <p className="font-medium text-slate-200 mt-1">{b.description}</p>
                      {b.lastSeen && (
                        <p className="font-mono text-xs text-amber-300">
                          📍 Thấy lần cuối: {b.lastSeen}
                        </p>
                      )}
                      <p className="font-mono text-[11px] text-slate-500 pt-1">
                        {fmtDate(b.createdAt)} · Sĩ quan phát lệnh: {b.author.callsign ?? b.author.fullName}
                      </p>
                    </div>

                    <form action={closeBolo}>
                      <input type="hidden" name="id" value={b.id} />
                      <button
                        className="btn btn-ok px-3 py-1.5 text-xs font-mono font-semibold"
                        title="Hủy BOLO sau khi đã bắt giữ hoặc hết tình huống"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> Hủy BOLO
                      </button>
                    </form>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Warrants */}
        <div className="space-y-6">
          {canWarrant ? (
            <Card
              title="Ban hành Lệnh truy nã tư pháp"
              icon={<Crosshair className="h-4 w-4 text-neon" />}
              subtitle="Quyền hạn: Supervisor / High Command"
            >
              <form action={createWarrant} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tên đối tượng *" required>
                    <input
                      name="targetName"
                      placeholder="VD: Tony Montana"
                      className="input"
                      required
                    />
                  </Field>
                  <Field label="Liên kết hồ sơ CSDL">
                    <select name="citizenId" className="input">
                      <option value="">— Không liên kết —</option>
                      {citizens.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Hành vi phạm tội / Căn cứ truy nã *" required>
                  <textarea
                    name="reason"
                    rows={2}
                    className="input"
                    placeholder="Giết người cướp của, chống người thi hành công vụ..."
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Mức độ nguy hiểm">
                    <select name="danger" className="input" defaultValue="MEDIUM">
                      <option value="LOW">Thấp</option>
                      <option value="MEDIUM">Trung bình</option>
                      <option value="HIGH">Cao</option>
                      <option value="EXTREME">Cực kỳ nguy hiểm</option>
                    </select>
                  </Field>
                  <Field label="Tiền thưởng truy nã ($)">
                    <input
                      name="bounty"
                      type="number"
                      min={0}
                      className="input font-mono"
                      defaultValue={0}
                    />
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-300 font-mono cursor-pointer pt-1">
                  <input type="checkbox" name="isPublic" defaultChecked className="rounded" />
                  <span>Hiển thị trên Bảng truy nã công khai của công dân</span>
                </label>
                <button className="btn btn-neon w-full py-2.5 font-mono text-xs font-bold tracking-wider shadow-neon">
                  PHÁT HÀNH LỆNH TRUY NÃ
                </button>
              </form>
            </Card>
          ) : (
            <div className="rounded-xl border border-line bg-panel2/50 p-4 text-center text-xs text-slate-400">
              Chỉ cấp bậc Supervisor trở lên mới có thẩm quyền ký và phát lệnh truy nã.
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
              Danh sách Lệnh truy nã ({warrants.length})
            </h3>

            {warrants.length === 0 ? (
              <Empty>Hiện chưa có lệnh truy nã nào.</Empty>
            ) : (
              warrants.map((w) => {
                const isAct = w.status === "ACTIVE";
                const dInfo = DANGER[w.danger];
                const sInfo = WSTATUS[w.status];
                return (
                  <Card
                    key={w.id}
                    tone={isAct ? "danger" : "default"}
                    className={isAct ? "" : "opacity-75"}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 text-sm flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-base font-bold uppercase text-white">
                            {w.targetName}
                          </p>
                          <Badge tone={sInfo.tone} dot={sInfo.dot}>
                            {sInfo.label}
                          </Badge>
                          <Badge tone={dInfo.tone}>{dInfo.label}</Badge>
                        </div>

                        <p className="text-slate-300 text-xs leading-relaxed">{w.reason}</p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 font-mono text-xs">
                          {w.bounty > 0 && (
                            <span className="rounded bg-ok/15 border border-ok/30 px-2 py-0.5 text-emerald-300 font-bold">
                              Thưởng: {money(w.bounty)}
                            </span>
                          )}
                          {w.isPublic && (
                            <span className="rounded bg-police/15 border border-police/30 px-2 py-0.5 text-blue-300">
                              Công khai
                            </span>
                          )}
                          <span className="text-slate-500 text-[11px]">
                            {fmtDate(w.createdAt)} · Ký bởi: {w.author.fullName}
                          </span>
                        </div>
                      </div>

                      {canWarrant && (
                        <div className="flex flex-col gap-1.5 shrink-0">
                          {isAct && (
                            <>
                              <form action={setWarrantStatus}>
                                <input type="hidden" name="id" value={w.id} />
                                <input type="hidden" name="status" value="SERVED" />
                                <button className="btn btn-ok w-full px-2.5 py-1 text-xs font-mono">
                                  Đã bắt
                                </button>
                              </form>
                              <form action={setWarrantStatus}>
                                <input type="hidden" name="id" value={w.id} />
                                <input type="hidden" name="status" value="CANCELLED" />
                                <button className="btn w-full px-2.5 py-1 text-xs font-mono text-slate-300">
                                  Hủy lệnh
                                </button>
                              </form>
                            </>
                          )}
                          {me.role === "HIGH_COMMAND" && (
                            <form action={deleteWarrant}>
                              <input type="hidden" name="id" value={w.id} />
                              <button
                                className="btn btn-danger w-full px-2.5 py-1 text-xs font-mono"
                                title="Xóa vĩnh viễn"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
