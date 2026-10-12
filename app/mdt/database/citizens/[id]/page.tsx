import Link from "next/link";
import { notFound } from "next/navigation";
import {
  User,
  Car,
  AlertTriangle,
  FileText,
  DollarSign,
  Archive,
  Edit,
  Plus,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { db } from "@/lib/db";
import { Badge, Card, Empty, Field, PageTitle, PlateBadge } from "@/components/ui";
import { fmtDate, money } from "@/lib/utils";
import { markFinePaid, updateCitizen } from "../../../actions";

export default async function CitizenPage({ params }: { params: { id: string } }) {
  const c = await db.citizen.findUnique({
    where: { id: params.id },
    include: {
      vehicles: true,
      fines: { orderBy: { createdAt: "desc" } },
      incidents: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { fullName: true } } },
      },
      warrants: { where: { status: "ACTIVE" } },
      evidence: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!c) notFound();

  const unpaidFines = c.fines.filter((f) => !f.paid);
  const unpaidTotal = unpaidFines.reduce((s, f) => s + f.amount, 0);
  const isWanted = c.warrants.length > 0;

  return (
    <div className="space-y-6">
      {/* Dossier Header Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle
          tag="POLICE DOSSIER"
          sub={`Hồ sơ tư pháp số: ${c.citizenId} · Ngày tạo: ${fmtDate(c.createdAt)}`}
        >
          {c.fullName}
        </PageTitle>

        <div className="flex items-center gap-2">
          {isWanted && (
            <Badge tone="danger" dot className="px-3 py-1 text-xs">
              ĐANG BỊ TRUY NÃ ĐẶC BIỆT
            </Badge>
          )}
          <Link
            href={`/mdt/reports/new?suspect=${c.id}`}
            className="btn btn-neon text-xs font-semibold px-3 py-2 shadow-neon"
          >
            <Plus className="h-3.5 w-3.5" /> Lập báo cáo án mới
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Dossier Card, Edit, Vehicles */}
        <div className="space-y-6">
          {/* Main Mugshot Dossier Card */}
          <Card
            tone={isWanted ? "danger" : "default"}
            className="space-y-4"
          >
            <div className="flex gap-4">
              {/* Mugshot Frame */}
              <div className="relative flex h-36 w-28 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-line bg-panel2 shadow-inner">
                {c.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.photoUrl}
                    alt={c.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <User className="h-10 w-10 text-slate-600" />
                    <span className="font-mono text-[10px] mt-1 text-slate-500">NO PHOTO</span>
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-black/75 py-0.5 text-center font-mono text-[9px] text-slate-300">
                  NCPD MUGSHOT
                </div>
              </div>

              {/* Bio Summary */}
              <div className="flex-1 space-y-1 text-xs">
                <p className="font-mono text-[10px] uppercase text-neon tracking-wider">
                  NOVARIS CITY CITIZEN
                </p>
                <h2 className="font-mono text-lg font-bold text-white uppercase">{c.fullName}</h2>
                <p className="font-mono text-slate-400">
                  CCCD: <span className="text-white font-semibold">{c.citizenId}</span>
                </p>
                <p className="text-slate-300">
                  SĐT: <span className="font-mono text-white">{c.phone ?? "Chưa rõ"}</span>
                </p>
                <p className="text-slate-300">
                  Ngày sinh: <span className="font-mono text-white">{c.dob ?? "Chưa rõ"}</span>
                </p>
              </div>
            </div>

            {/* Warning tags */}
            <div className="border-t border-line/60 pt-3">
              <p className="font-mono text-[10px] uppercase text-slate-400 mb-1.5">
                Cảnh báo nguy cơ & Tiền sự:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {c.tags.length === 0 ? (
                  <span className="text-xs text-slate-500">Chưa ghi nhận cảnh báo nguy hiểm.</span>
                ) : (
                  c.tags.map((t) => (
                    <Badge key={t} tone="danger" dot>
                      {t}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* Notes */}
            {c.notes && (
              <div className="rounded-lg border border-line bg-panel2/60 p-3 text-xs">
                <p className="font-mono text-[10px] uppercase text-slate-400 mb-1">
                  Ghi chú hồ sơ:
                </p>
                <p className="whitespace-pre-wrap text-slate-200 leading-relaxed font-sans">
                  {c.notes}
                </p>
              </div>
            )}
          </Card>

          {/* Edit Profile Form */}
          <Card
            title="Cập nhật hồ sơ"
            icon={<Edit className="h-4 w-4" />}
            subtitle="Chỉnh sửa thông tin liên lạc, ảnh và cảnh báo"
          >
            <form action={updateCitizen} className="space-y-3">
              <input type="hidden" name="id" value={c.id} />
              <Field label="Số điện thoại IC">
                <input name="phone" defaultValue={c.phone ?? ""} className="input font-mono" />
              </Field>
              <Field label="Link ảnh chân dung">
                <input name="photoUrl" defaultValue={c.photoUrl ?? ""} className="input" />
              </Field>
              <Field label="Tag cảnh báo" hint="Cách nhau bằng dấu phẩy">
                <input name="tags" defaultValue={c.tags.join(", ")} className="input" />
              </Field>
              <Field label="Ghi chú nhận dạng">
                <textarea
                  name="notes"
                  defaultValue={c.notes ?? ""}
                  rows={3}
                  className="input text-xs"
                />
              </Field>
              <button className="btn btn-neon w-full py-2 font-semibold text-xs">
                Lưu thay đổi
              </button>
            </form>
          </Card>

          {/* Vehicles Owned */}
          <Card
            title={`Phương tiện sở hữu (${c.vehicles.length})`}
            icon={<Car className="h-4 w-4" />}
            subtitle="Các xe đứng tên đối tượng tại DMV"
          >
            {c.vehicles.length === 0 ? (
              <Empty>Đối tượng hiện không đứng tên sở hữu phương tiện nào.</Empty>
            ) : (
              <ul className="space-y-2">
                {c.vehicles.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between rounded-lg border border-line bg-panel2/60 p-2.5 text-xs"
                  >
                    <PlateBadge plate={v.plate} stolen={v.stolen} />
                    <span className="text-slate-300 font-medium">
                      {v.model} · {v.color}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right 2 Columns: Incidents, Fines, Evidence */}
        <div className="space-y-6 lg:col-span-2">
          {/* Priors / Incidents Record */}
          <Card
            title={`Lịch sử tiền án & Báo cáo (${c.incidents.length})`}
            icon={<FileText className="h-4 w-4" />}
            subtitle="Danh sách các vụ án đối tượng đã bị lập biên bản xử lý"
            action={
              <Link
                href={`/mdt/reports/new?suspect=${c.id}`}
                className="btn btn-neon py-1 px-2.5 text-xs font-mono"
              >
                + Lập báo cáo
              </Link>
            }
          >
            {c.incidents.length === 0 ? (
              <Empty>Lý lịch tư pháp trong sạch – Chưa có tiền án.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left">
                      <th className="th">Mã vụ việc</th>
                      <th className="th">Tên vụ việc & Thời gian</th>
                      <th className="th">Sĩ quan</th>
                      <th className="th text-right">Phạt tiền</th>
                      <th className="th text-right">Án tù</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.incidents.map((i) => (
                      <tr
                        key={i.id}
                        className="border-b border-line/40 transition hover:bg-panel2/60"
                      >
                        <td className="td py-3 font-mono font-bold text-neon">{i.number}</td>
                        <td className="td py-3">
                          <p className="font-semibold text-white">{i.title}</p>
                          <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                            {fmtDate(i.createdAt)}
                          </p>
                        </td>
                        <td className="td py-3 text-slate-400 text-xs">{i.author.fullName}</td>
                        <td className="td py-3 text-right font-mono text-xs text-amber-300">
                          {money(i.totalFine)}
                        </td>
                        <td className="td py-3 text-right font-mono text-xs text-red-300">
                          {i.totalJail} phút
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Unpaid & Paid Fines */}
          <Card
            title="Biên bản phạt hành chính"
            icon={<DollarSign className="h-4 w-4" />}
            subtitle={`Tổng tiền phạt chưa thanh toán: ${money(unpaidTotal)}`}
            tone={unpaidTotal > 0 ? "warn" : "default"}
          >
            {c.fines.length === 0 ? (
              <Empty>Không có biên bản phạt vi phạm.</Empty>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-line/60 pb-2 text-xs font-mono text-slate-400">
                  <span>Nội dung vi phạm</span>
                  <span>Mức phạt & Trạng thái</span>
                </div>
                {c.fines.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel2/50 p-2.5 text-xs transition"
                  >
                    <div>
                      <span className={f.paid ? "text-slate-500 line-through" : "text-white font-medium"}>
                        {f.reason}
                      </span>
                      <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                        {fmtDate(f.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-amber-300">{money(f.amount)}</span>
                      {f.paid ? (
                        <Badge tone="ok">Đã nộp phạt</Badge>
                      ) : (
                        <form action={markFinePaid}>
                          <input type="hidden" name="id" value={f.id} />
                          <button className="btn btn-ok py-1 px-2.5 text-xs font-mono">
                            Xác nhận nộp
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Seized Evidence */}
          <Card
            title={`Tang vật liên quan (${c.evidence.length})`}
            icon={<Archive className="h-4 w-4" />}
            subtitle="Tang vật đã thu giữ được niêm phong trong kho"
          >
            {c.evidence.length === 0 ? (
              <Empty>Chưa có tang vật nào thu giữ từ đối tượng.</Empty>
            ) : (
              <div className="space-y-3">
                {c.evidence.map((e) => (
                  <div
                    key={e.id}
                    className="rounded-lg border border-line bg-panel2/60 p-3 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge tone="info">TỦ #{e.locker}</Badge>
                      <span className="font-mono text-[11px] text-slate-400">{fmtDate(e.createdAt)}</span>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-slate-200 leading-relaxed">
                      {e.items}
                    </pre>
                    {e.mediaUrl && (
                      <a
                        href={e.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-neon hover:underline font-mono text-[11px]"
                      >
                        <ExternalLink className="h-3 w-3" /> Xem Ảnh/Video Tang vật
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
