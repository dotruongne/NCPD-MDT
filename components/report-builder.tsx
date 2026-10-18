"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Minus,
  Plus,
  Save,
  Trash2,
  Search,
  Scale,
  FileText,
  Send,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Siren,
  CheckCircle2,
} from "lucide-react";
import { createIncident } from "@/app/mdt/actions";
import { money } from "@/lib/utils";
import { useToast } from "@/components/toast-provider";
import { Badge, Card, Field, Modal, AlertBanner } from "@/components/ui";

type Charge = { id: string; code: string; title: string; category: string; fine: number; jailMinutes: number };
type CitizenOpt = { id: string; fullName: string; citizenId: string };
type Officer = { fullName: string; rank: string; badge: string; callsign: string | null };

type Draft = {
  title: string;
  location: string;
  narrative: string;
  suspectId: string;
  suspectName: string;
  counts: Record<string, number>;
  updatedAt?: number;
};

const DRAFT_KEY = "mdt_report_draft_v1";
const EMPTY: Draft = {
  title: "",
  location: "",
  narrative: "",
  suspectId: "",
  suspectName: "",
  counts: {},
};

export function ReportBuilder({
  charges,
  citizens,
  officer,
  presetSuspect,
}: {
  charges: Charge[];
  citizens: CitizenOpt[];
  officer: Officer;
  presetSuspect?: string;
}) {
  const router = useRouter();
  const [d, setD] = useState<Draft>({ ...EMPTY, suspectId: presetSuspect ?? "" });
  const [chargeQuery, setChargeQuery] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [recoveryDraft, setRecoveryDraft] = useState<Draft | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const { showToast } = useToast();

  // Khôi phục bản nháp với Crash Recovery Modal (ADR-0003 Draft Vault)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Draft;
        const hasContent =
          Boolean(saved.title?.trim()) ||
          Boolean(saved.narrative?.trim()) ||
          Boolean(saved.suspectId) ||
          Object.keys(saved.counts ?? {}).length > 0;

        if (hasContent && !presetSuspect) {
          setRecoveryDraft(saved);
        } else {
          setD({ ...EMPTY, ...saved, suspectId: presetSuspect || saved.suspectId || "" });
          setSavedAt("Đã nạp bản nháp");
        }
      }
    } catch {}
    setLoaded(true);
  }, [presetSuspect]);

  // Draft Vault: Tự lưu nháp sau mỗi 2s (Debounced 1000ms khi người dùng nhập liệu)
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        const payload: Draft = { ...d, updatedAt: Date.now() };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
        const timeStr = new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
        setSavedAt(`Đã lưu lúc ${timeStr}`);
      } catch {}
    }, 800);
    return () => clearTimeout(timer.current);
  }, [d, loaded]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  
  const bump = (id: string, delta: number) =>
    setD((p) => {
      const next = { ...p.counts };
      const n = (next[id] ?? 0) + delta;
      if (n <= 0) delete next[id];
      else next[id] = Math.min(n, 20);
      return { ...p, counts: next };
    });

  const selected = useMemo(
    () => charges.filter((c) => d.counts[c.id]).map((c) => ({ ...c, count: d.counts[c.id] })),
    [charges, d.counts]
  );
  const totalFine = selected.reduce((s, c) => s + c.fine * c.count, 0);
  const totalJail = selected.reduce((s, c) => s + c.jailMinutes * c.count, 0);

  const filteredCharges = useMemo(() => {
    if (!chargeQuery.trim()) return charges;
    const q = chargeQuery.toLowerCase();
    return charges.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [charges, chargeQuery]);

  const cats = useMemo(() => [...new Set(filteredCharges.map((c) => c.category))], [filteredCharges]);
  const suspect = citizens.find((c) => c.id === d.suspectId);

  const markdown = () => {
    const lines = [
      `## 🚨 BÁO CÁO VỤ ÁN NCPD`,
      `**Sĩ quan thụ lý:** ${officer.rank} ${officer.fullName} (#${officer.badge})${officer.callsign ? ` · Callsign: ${officer.callsign}` : ""}`,
      `**Thời gian lập:** ${new Date().toLocaleString("vi-VN")}`,
      `**Tiêu đề:** ${d.title || "—"}`,
      `**Đối tượng:** ${suspect ? `${suspect.fullName} (CCCD: ${suspect.citizenId})` : d.suspectName || "—"}`,
      `**Địa điểm:** ${d.location || "—"}`,
      ``,
      `### ⚖️ Tội danh áp dụng`,
      ...(selected.length
        ? selected.map((c) => `- \`${c.code}\` ${c.title}${c.count > 1 ? ` ×${c.count}` : ""} — ${money(c.fine * c.count)} / ${c.jailMinutes * c.count} phút tù`)
        : ["- Không có"]),
      ``,
      `> **Tổng tiền phạt:** ${money(totalFine)}`,
      `> **Tổng thời gian thụ án:** ${totalJail} phút`,
      ``,
      `### 📝 Tường trình sự việc`,
      d.narrative || "—",
    ];
    return lines.join("\n");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown());
    } catch {
      const ta = document.createElement("textarea");
      ta.value = markdown();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    showToast({ type: "success", title: "Đã sao chép", message: "Bản báo cáo đã được chép vào bộ nhớ tạm chuẩn Discord Markdown." });
  };

  const submit = () => {
    if (!d.title.trim()) {
      return showToast({ type: "error", title: "Thiếu tiêu đề", message: "Vui lòng nhập tiêu đề vụ việc." });
    }
    if (!d.narrative.trim()) {
      return showToast({ type: "error", title: "Thiếu tường trình", message: "Vui lòng nhập nội dung tường trình chi tiết của sĩ quan." });
    }

    start(async () => {
      const res = await createIncident({
        title: d.title,
        location: d.location,
        narrative: d.narrative,
        suspectId: d.suspectId || null,
        suspectName: d.suspectName,
        charges: selected.map((c) => ({ id: c.id, count: c.count })),
      });
      if (!res.ok) return showToast({ type: "error", title: "Không thể tạo báo cáo", message: res.error });
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      showToast({ type: "success", title: "Thành công", message: "Đã lưu hồ sơ báo cáo vào CSDL tác chiến." });
      router.push("/mdt/reports");
    });
  };

  const clearDraft = () => {
    if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ bản nháp này?")) return;
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    setD(EMPTY);
    setSavedAt(null);
    showToast({ type: "info", title: "Đã xóa", message: "Đã làm trống bản nháp báo cáo." });
  };

  const restoreConfirmedDraft = () => {
    if (recoveryDraft) {
      setD(recoveryDraft);
      setSavedAt("Đã khôi phục từ Draft Vault");
      setRecoveryDraft(null);
      showToast({ type: "success", title: "Đã khôi phục", message: "Bản nháp trước đó đã được phục hồi." });
    }
  };

  const discardRecoveryDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    setRecoveryDraft(null);
    setD(EMPTY);
  };

  return (
    <div className="mdt-report-builder space-y-6">
      {/* Recovery Modal */}
      <Modal
        open={Boolean(recoveryDraft)}
        onClose={discardRecoveryDraft}
        title="DRAFT VAULT: PHÁT HIỆN BẢN NHÁP CHƯA GỬI"
        width="md"
      >
        <div className="space-y-4 text-xs">
          <AlertBanner
            level="info"
            title="Hệ thống tự động phát hiện bản nháp phiên làm việc trước"
          >
            Hệ thống đã lưu trữ an toàn bản báo cáo chưa hoàn tất của bạn để phòng chống mất dữ liệu khi gián đoạn.
          </AlertBanner>

          <div className="rounded border border-line bg-panel2 p-3 font-mono space-y-1.5">
            <p className="text-white font-semibold">
              Tiêu đề: <span className="text-neon">{recoveryDraft?.title || "(Chưa đặt tiêu đề)"}</span>
            </p>
            <p className="text-slate-400">
              Đối tượng: <span className="text-slate-200">{recoveryDraft?.suspectName || recoveryDraft?.suspectId || "Chưa chọn"}</span>
            </p>
            <p className="text-slate-400">
              Số tội danh đã gán: <span className="text-amber-300">{Object.keys(recoveryDraft?.counts ?? {}).length}</span>
            </p>
            {recoveryDraft?.updatedAt && (
              <p className="text-slate-500 text-[10px]">
                Thời điểm ghi nhận: {new Date(recoveryDraft.updatedAt).toLocaleString("vi-VN")}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={discardRecoveryDraft}
              className="btn text-xs font-mono py-2"
            >
              Hủy & Tạo mới
            </button>
            <button
              type="button"
              onClick={restoreConfirmedDraft}
              className="btn btn-neon text-xs font-mono font-bold py-2 shadow-neon flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Khôi phục bản nháp
            </button>
          </div>
        </div>
      </Modal>

      {/* 2-Column Split-Screen Layout (≥ 1280px grid-cols-[1fr_360px]) */}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Left Column: Form & Charges Catalog */}
        <div className="space-y-6 min-w-0">
          {/* Incident Info */}
          <Card
            title="Thông tin vụ việc & Đối tượng"
            icon={<FileText className="h-4 w-4" />}
            subtitle="Ghi nhận hồ sơ đối tượng và dữ kiện ban đầu của vụ án"
            action={
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-neon bg-neon/10 border border-neon/25 rounded px-2.5 py-1">
                  <Save className="h-3.5 w-3.5" /> {savedAt ?? "Đang khởi tạo Draft Vault..."}
                </span>
              </div>
            }
          >
            <div className="space-y-4 pt-1">
              <Field label="Tiêu đề vụ việc" required hint="Ngắn gọn, rõ hành vi chính">
                <input
                  className="input font-semibold"
                  placeholder="VD: Cướp ngân hàng Fleeca Legion & Nổ súng chống đối cảnh sát"
                  value={d.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Đối tượng (Tra cứu từ CSDL Cảnh sát)">
                  <select
                    className="input font-mono text-xs"
                    value={d.suspectId}
                    onChange={(e) => set("suspectId", e.target.value)}
                  >
                    <option value="">— Chọn hồ sơ công dân đã lưu —</option>
                    {citizens.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} [{c.citizenId}]
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Hoặc nhập định danh tạm thời" hint="Khi chưa xác định CCCD">
                  <input
                    className="input text-xs"
                    placeholder="VD: Nghi phạm áo đen bịt mặt mặt nạ hề..."
                    value={d.suspectName}
                    onChange={(e) => set("suspectName", e.target.value)}
                    disabled={Boolean(d.suspectId)}
                  />
                </Field>
              </div>

              <Field label="Địa điểm xảy ra sự vụ" hint="Ngã tư, khu vực hoặc postal code">
                <input
                  className="input text-xs"
                  placeholder="VD: Postal 8012 - Đại lộ Vinewood Blvd & Alta St"
                  value={d.location}
                  onChange={(e) => set("location", e.target.value)}
                />
              </Field>

              <Field label="Tường trình chi tiết của sĩ quan thụ lý" required hint="Bắt buộc ghi rõ diễn biến">
                <textarea
                  className="input leading-relaxed text-xs"
                  rows={8}
                  placeholder="Diễn biến chi tiết: Quá trình tiếp nhận tin báo, phát hiện đối tượng, hiệu lệnh dừng phương tiện, thái độ hợp tác/chống đối, tang vật phát hiện trên người..."
                  value={d.narrative}
                  onChange={(e) => set("narrative", e.target.value)}
                />
              </Field>
            </div>
          </Card>

          {/* Charges Catalog */}
          <Card
            title="Danh mục tội danh áp dụng"
            icon={<Scale className="h-4 w-4" />}
            subtitle="Tra cứu điều luật hình sự & dân sự theo Nghị định Tư pháp Novaris City"
            action={
              <div className="relative w-48 sm:w-64">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  value={chargeQuery}
                  onChange={(e) => setChargeQuery(e.target.value)}
                  placeholder="Tìm mã hoặc tên tội..."
                  className="input pl-8 py-1.5 text-xs"
                />
              </div>
            }
          >
            <div className="space-y-5 pt-1">
              {cats.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 font-mono">
                  Không tìm thấy điều khoản tội danh khớp với từ khóa "{chargeQuery}".
                </div>
              ) : (
                cats.map((cat) => (
                  <div key={cat} className="space-y-2">
                    <div className="flex items-center gap-2 border-b border-line/60 pb-1">
                      <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-neon">
                        // {cat}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({filteredCharges.filter((c) => c.category === cat).length} điều khoản)
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {filteredCharges
                        .filter((c) => c.category === cat)
                        .map((c) => {
                          const n = d.counts[c.id] ?? 0;
                          return (
                            <div
                              key={c.id}
                              className={`flex items-center justify-between gap-2 rounded border p-2.5 text-xs transition ${
                                n
                                  ? "border-neon/60 bg-neon/10 shadow-neon"
                                  : "border-line bg-panel2/50 hover:border-slate-500"
                              }`}
                            >
                              <div className="flex-1 pr-1 min-w-0">
                                <p className="font-semibold text-white truncate">
                                  <span className="font-mono text-neon font-bold mr-1.5">{c.code}</span>
                                  {c.title}
                                </p>
                                <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                                  <span className="text-amber-300 font-bold">{money(c.fine)}</span> · {c.jailMinutes}p tù
                                </p>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => bump(c.id, -1)}
                                  className="btn px-2 py-1 text-xs"
                                  disabled={!n}
                                  title="Giảm số lần vi phạm"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-5 text-center font-mono font-bold text-white text-xs">
                                  {n}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => bump(c.id, 1)}
                                  className="btn px-2 py-1 text-xs"
                                  title="Thêm số lần vi phạm"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Sticky Live Summary Sidebar */}
        <aside className="space-y-4">
          <div className="sticky top-20 space-y-4">
            <Card
              title="Tổng kết án phạt thời gian thực"
              icon={<Scale className="h-4 w-4" />}
              action={
                <Badge tone={selected.length > 0 ? "warn" : "neutral"} dot={selected.length > 0}>
                  {selected.length} Tội danh
                </Badge>
              }
            >
              <div className="space-y-4">
                {/* Selected Charges Pill List */}
                {selected.length === 0 ? (
                  <div className="rounded border border-dashed border-line p-4 text-center text-xs text-slate-500 font-mono">
                    Chưa gán tội danh nào. Hãy nhấn dấu (+) ở danh mục tội phạm để bắt đầu tính án.
                  </div>
                ) : (
                  <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                    {selected.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between gap-2 rounded border border-line bg-panel2/80 p-2 text-xs"
                      >
                        <div className="flex-1 min-w-0 pr-1">
                          <span className="font-mono font-bold text-neon">{c.code}</span>{" "}
                          <span className="text-slate-200 truncate">{c.title}</span>
                          {c.count > 1 && (
                            <span className="ml-1.5 rounded bg-neon/20 px-1 py-0.2 font-mono font-bold text-neon text-[10px]">
                              ×{c.count}
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-amber-300 shrink-0">
                          {money(c.fine * c.count)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Totals Metric Cards */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="rounded border border-danger/40 bg-danger/10 p-3 text-center">
                    <p className="font-mono text-[10px] uppercase font-bold tracking-wider text-red-300">
                      Tổng tiền phạt
                    </p>
                    <p className="mt-1 font-mono text-xl font-bold text-white truncate">
                      {money(totalFine)}
                    </p>
                  </div>

                  <div className="rounded border border-warn/40 bg-warn/10 p-3 text-center">
                    <p className="font-mono text-[10px] uppercase font-bold tracking-wider text-amber-300">
                      Tổng thời gian tù
                    </p>
                    <p className="mt-1 font-mono text-xl font-bold text-white">
                      {totalJail}
                      <span className="text-xs font-normal text-slate-400"> phút</span>
                    </p>
                  </div>
                </div>

                {/* Severity Tier Indicator */}
                <div className="rounded border border-line bg-panel2/50 p-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Khung hình phạt:</span>
                    <span className="font-bold text-white">
                      {totalJail > 60
                        ? "ÁN NẶNG (TRỌNG TỘI)"
                        : totalJail > 0
                        ? "GIAM GIỮ TẠM THỜI"
                        : totalFine > 0
                        ? "XỬ PHẠT HÀNH CHÍNH"
                        : "CHƯA XÁC ĐỊNH"}
                    </span>
                  </div>
                  {totalJail > 90 && (
                    <p className="text-[10px] text-red-400 font-mono leading-tight">
                      ⚠ Cần thông báo cho Đội Kiểm sát & Lãnh đạo Đồn xác nhận.
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={copy}
                    className="btn btn-neon w-full py-2.5 font-mono text-xs font-bold shadow-neon flex items-center justify-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    EXPORT FORMAT DISCORD
                  </button>

                  <button
                    type="button"
                    onClick={submit}
                    disabled={pending}
                    className="btn btn-ok w-full py-2.5 font-mono text-xs font-bold tracking-wider shadow-ok flex items-center justify-center gap-2"
                  >
                    {pending ? (
                      <>
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ĐANG GHI VÀO CSDL...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        GỬI BÁO CÁO ÁN LÊN HỆ THỐNG
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={clearDraft}
                    className="btn btn-danger w-full py-2 text-xs font-mono flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> XÓA BẢN NHÁP HIỆN TẠI
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
