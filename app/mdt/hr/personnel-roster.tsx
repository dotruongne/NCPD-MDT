"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Activity, KeyRound, Plus, Search, ShieldCheck, UserRound, UserPlus, Users, X } from "lucide-react";
import { Badge, Empty } from "@/components/ui";
import { ToastOnChange } from "@/components/toast-provider";
import { createOfficer, deleteOfficerAccount, resetOfficerPassword, updateOfficer } from "../actions";

type PersonnelRole = "OFFICER" | "SUPERVISOR" | "ACCOUNTING" | "FTO" | "HIGH_COMMAND";

type OfficerSummary = {
  id: string;
  fullName: string;
  username: string;
  rank: string;
  badge: string;
  callsign: string | null;
  role: PersonnelRole;
  active: boolean;
  onDuty: boolean;
  salaryPerHour: number;
};

type ActionState = { status: "success" | "error"; message: string } | null;

const EMPTY_STATE: ActionState = null;
const ROLE_LABELS: Record<PersonnelRole, string> = {
  OFFICER: "Officer",
  SUPERVISOR: "Supervisor",
  ACCOUNTING: "Phòng Kế toán",
  FTO: "Phòng FTO",
  HIGH_COMMAND: "High Command",
};

function ActionFeedback({ state }: { state: ActionState }) {
  if (!state) return null;
  return <ToastOnChange eventKey={state} message={state.message} type={state.status} />;
}

function SubmitButton({
  children,
  className,
  disabled = false,
}: {
  children: React.ReactNode;
  className: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className={className}>
      {pending ? "Đang xử lý..." : children}
    </button>
  );
}

function OfficerCard({
  officer,
  hours,
  isCurrent,
  onDeactivated,
}: {
  officer: OfficerSummary;
  hours: string;
  isCurrent: boolean;
  onDeactivated: () => void;
}) {
  const [profileState, profileAction] = useFormState(updateOfficer, EMPTY_STATE);
  const [passwordState, passwordAction] = useFormState(resetOfficerPassword, EMPTY_STATE);
  const [deleteState, deleteAction] = useFormState(deleteOfficerAccount, EMPTY_STATE);
  const passwordForm = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (passwordState?.status === "success") passwordForm.current?.reset();
  }, [passwordState]);

  useEffect(() => {
    if (deleteState?.status === "success") onDeactivated();
  }, [deleteState, onDeactivated]);

  const confirmDeactivation = (event: React.FormEvent<HTMLFormElement>) => {
    if (!window.confirm(`Vô hiệu hóa tài khoản của ${officer.fullName}? Lịch sử công tác sẽ được giữ lại.`)) {
      event.preventDefault();
    }
  };

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-panel2/45">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line/70 p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-police/40 bg-police/10 text-sm font-bold text-sky-100">
            {officer.fullName.split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-white">{officer.fullName}</h3>
            <p className="mt-1 truncate font-mono text-xs text-slate-400">
              @{officer.username} <span className="text-slate-600">·</span> #{officer.badge}
              {officer.callsign && <> <span className="text-slate-600">·</span> {officer.callsign}</>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={officer.active ? "ok" : "neutral"} dot>
            {officer.active ? "Đang hoạt động" : "Đã khóa"}
          </Badge>
          {officer.onDuty && <Badge tone="info" dot>Đang trực</Badge>}
          <Badge tone="info">{ROLE_LABELS[officer.role]}</Badge>
        </div>
      </div>

      <div className="grid gap-3 px-4 py-3 sm:grid-cols-3 sm:px-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cấp bậc</p>
          <p className="mt-1 text-sm text-slate-200">{officer.rank}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Trực 7 ngày</p>
          <p className="mt-1 font-mono text-sm font-semibold text-sky-200">{hours}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Lương / giờ</p>
          <p className="mt-1 font-mono text-sm text-slate-200">${officer.salaryPerHour.toLocaleString("en-US")}</p>
        </div>
      </div>

      <div className="grid gap-3 border-t border-line/70 p-4 sm:grid-cols-2 sm:p-5">
        <details className="group rounded-lg border border-line bg-panel/60">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm font-medium text-slate-200 marker:hidden">
            <span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4 text-sky-300" aria-hidden="true" /> Chỉnh sửa hồ sơ</span>
            <span className="text-xs text-slate-500 group-open:hidden">Mở</span>
            <span className="hidden text-xs text-slate-500 group-open:inline">Đóng</span>
          </summary>
          <form action={profileAction} className="space-y-3 border-t border-line/70 p-3">
            <input type="hidden" name="id" value={officer.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-slate-400">
                Cấp bậc
                <input name="rank" defaultValue={officer.rank} maxLength={80} className="input py-2 text-sm" required />
              </label>
              <label className="space-y-1 text-xs text-slate-400">
                Badge
                <input name="badge" defaultValue={officer.badge} maxLength={40} className="input py-2 font-mono text-sm" required />
              </label>
              <label className="space-y-1 text-xs text-slate-400">
                Phân quyền
                {isCurrent ? (
                  <>
                    <input type="hidden" name="role" value={officer.role} />
                    <span className="input block py-2 text-sm text-slate-500">{ROLE_LABELS[officer.role]} · không thể tự đổi</span>
                  </>
                ) : (
                  <select name="role" defaultValue={officer.role} className="input py-2 text-sm">
                    <option value="OFFICER">Officer</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ACCOUNTING">Phòng Kế toán</option>
                    <option value="FTO">Phòng FTO</option>
                    <option value="HIGH_COMMAND">High Command</option>
                  </select>
                )}
              </label>
              <label className="space-y-1 text-xs text-slate-400">
                Lương / giờ
                <input name="salaryPerHour" type="number" min="0" step="1" defaultValue={officer.salaryPerHour} className="input py-2 font-mono text-sm" required />
              </label>
            </div>
            <label className="flex min-h-10 items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" name="active" defaultChecked={officer.active} disabled={isCurrent} className="h-4 w-4 rounded border-line bg-panel accent-sky-400" />
              Tài khoản được phép đăng nhập
              {isCurrent && <input type="hidden" name="active" value="on" />}
            </label>
            <ActionFeedback state={profileState} />
            <SubmitButton className="btn btn-neon min-h-10 w-full px-4 text-xs font-semibold sm:w-auto">
              Lưu hồ sơ
            </SubmitButton>
          </form>
        </details>

        <details className="group rounded-lg border border-line bg-panel/60">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm font-medium text-slate-200 marker:hidden">
            <span className="inline-flex items-center gap-2"><KeyRound className="h-4 w-4 text-amber-300" aria-hidden="true" /> Đặt lại mật khẩu</span>
            <span className="text-xs text-slate-500 group-open:hidden">Mở</span>
            <span className="hidden text-xs text-slate-500 group-open:inline">Đóng</span>
          </summary>
          {isCurrent ? (
            <p className="border-t border-line/70 p-3 text-xs leading-relaxed text-slate-400">
              Dùng trang Bảo mật tài khoản để đổi mật khẩu của chính bạn.
            </p>
          ) : (
            <form action={passwordAction} ref={passwordForm} className="space-y-3 border-t border-line/70 p-3">
              <input type="hidden" name="id" value={officer.id} />
              <p className="text-xs leading-relaxed text-slate-400">
                Mật khẩu này chỉ dùng tạm: nhân viên phải tạo mật khẩu riêng ngay sau lần đăng nhập kế tiếp.
              </p>
              <label className="block space-y-1 text-xs text-slate-400">
                Mật khẩu mới
                <input name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} className="input py-2 text-sm" required />
              </label>
              <label className="block space-y-1 text-xs text-slate-400">
                Nhập lại mật khẩu
                <input name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} className="input py-2 text-sm" required />
              </label>
              <ActionFeedback state={passwordState} />
              <SubmitButton className="btn min-h-10 w-full border border-amber-400/30 px-4 text-xs font-semibold text-amber-200 hover:bg-amber-400/10 sm:w-auto">
                Cập nhật mật khẩu
              </SubmitButton>
            </form>
          )}
        </details>
      </div>

      {!isCurrent && officer.active && (
        <form action={deleteAction} onSubmit={confirmDeactivation} className="flex flex-col gap-3 border-t border-line/70 bg-red-950/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <input type="hidden" name="id" value={officer.id} />
          <p className="text-xs leading-relaxed text-slate-400">
            Vô hiệu hóa đăng nhập, kết thúc ca trực đang mở và giữ nguyên hồ sơ lịch sử.
          </p>
          <SubmitButton className="btn btn-danger min-h-10 shrink-0 px-4 text-xs font-semibold">
            Vô hiệu hóa tài khoản
          </SubmitButton>
          <ActionFeedback state={deleteState} />
        </form>
      )}
      {!isCurrent && !officer.active && (
        <div className="border-t border-line/70 px-4 py-3 text-xs text-slate-500 sm:px-5">
          Tài khoản đã khóa. Có thể đặt lại mật khẩu hoặc kích hoạt lại trong phần chỉnh sửa hồ sơ.
        </div>
      )}
    </article>
  );
}

function CreateOfficerForm() {
  const [state, formAction] = useFormState(createOfficer, EMPTY_STATE);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.status === "success") form.current?.reset();
  }, [state]);

  return (
    <form action={formAction} ref={form} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <label className="space-y-1 text-xs text-slate-400">
        Họ tên IC
        <input name="fullName" autoComplete="name" maxLength={100} placeholder="Ví dụ: John Connor" className="input py-2 text-sm" required />
      </label>
      <label className="space-y-1 text-xs text-slate-400">
        Tên tài khoản
        <input name="username" autoComplete="username" minLength={3} maxLength={40} pattern="[a-zA-Z0-9._-]+" placeholder="jconnor" className="input py-2 font-mono text-sm" required />
      </label>
      <label className="space-y-1 text-xs text-slate-400">
        Badge
        <input name="badge" maxLength={40} placeholder="104" className="input py-2 font-mono text-sm" required />
      </label>
      <label className="space-y-1 text-xs text-slate-400">
        Cấp bậc ban đầu
        <input name="rank" defaultValue="Cadet" maxLength={80} className="input py-2 text-sm" required />
      </label>
      <label className="space-y-1 text-xs text-slate-400">
        Mật khẩu tạm
        <input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} className="input py-2 text-sm" required />
      </label>
      <div className="space-y-2 sm:col-span-2 xl:col-span-5">
        <p className="text-[11px] leading-relaxed text-slate-500">Tối thiểu 12 ký tự, có chữ hoa, chữ thường và số. Nhân viên bắt buộc đổi sau lần đăng nhập đầu tiên.</p>
        <ActionFeedback state={state} />
        <SubmitButton className="btn btn-neon min-h-10 w-full px-4 text-xs font-semibold sm:w-auto">
          <UserPlus className="mr-2 inline h-4 w-4" aria-hidden="true" /> Tạo tài khoản nhân viên
        </SubmitButton>
      </div>
    </form>
  );
}

export default function PersonnelRoster({
  officers,
  hoursByOfficer,
  currentOfficerId,
}: {
  officers: OfficerSummary[];
  hoursByOfficer: Record<string, string>;
  currentOfficerId: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("active");
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const onDeactivated = useCallback(() => {
    setStatus("all");
  }, []);
  const activeCount = officers.filter((officer) => officer.active).length;
  const dutyCount = officers.filter((officer) => officer.onDuty).length;
  const filteredOfficers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return officers.filter((officer) => {
      if (status === "active" && !officer.active) return false;
      if (status === "inactive" && officer.active) return false;
      if (!normalizedQuery) return true;
      return [officer.fullName, officer.username, officer.badge, officer.callsign ?? "", officer.rank]
        .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
    });
  }, [officers, query, status]);
  const selectedOfficer = officers.find((officer) => officer.id === selectedOfficerId) ?? null;
  const dialogOpen = createOpen || selectedOfficer !== null;

  useEffect(() => {
    if (!dialogOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCreateOpen(false);
        setSelectedOfficerId(null);
        return;
      }
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus();
    };
  }, [dialogOpen]);

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-3" aria-label="Tổng quan nhân sự">
        <div className="rounded-xl border border-line bg-panel p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tổng hồ sơ</p>
          <p className="mt-2 flex items-center gap-2 font-mono text-2xl font-semibold text-white"><Users className="h-5 w-5 text-sky-300" aria-hidden="true" /> {officers.length}</p>
          <p className="mt-1 text-xs text-slate-500">Bao gồm cả hồ sơ đã khóa</p>
        </div>
        <div className="rounded-xl border border-line bg-panel p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tài khoản hoạt động</p>
          <p className="mt-2 flex items-center gap-2 font-mono text-2xl font-semibold text-emerald-200"><ShieldCheck className="h-5 w-5" aria-hidden="true" /> {activeCount}</p>
          <p className="mt-1 text-xs text-slate-500">Có thể đăng nhập MDT</p>
        </div>
        <div className="rounded-xl border border-line bg-panel p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Đang trực</p>
          <p className="mt-2 flex items-center gap-2 font-mono text-2xl font-semibold text-amber-200"><Activity className="h-5 w-5" aria-hidden="true" /> {dutyCount}</p>
          <p className="mt-1 text-xs text-slate-500">Trong tổng số {activeCount} tài khoản đang hoạt động</p>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="roster-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="roster-heading" className="text-base font-semibold text-white">Danh sách nhân viên</h2>
            <p className="mt-1 text-xs text-slate-500">Chọn một hồ sơ để xem chi tiết và thao tác quản lý.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 sm:w-72">
              <span className="sr-only">Tìm nhân viên</span>
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="input min-h-10 pl-9 text-sm"
                placeholder="Tên, tài khoản, badge..."
              />
            </label>
            <label>
              <span className="sr-only">Lọc trạng thái nhân viên</span>
              <select
                value={status}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "all" || value === "active" || value === "inactive") setStatus(value);
                }}
                className="input min-h-10 text-sm sm:w-44"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Đã khóa</option>
              </select>
            </label>
            <button type="button" onClick={() => setCreateOpen(true)} className="btn btn-neon min-h-10 whitespace-nowrap px-4 text-xs font-semibold">
              <Plus className="h-4 w-4" aria-hidden="true" /> Tạo tài khoản
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500" aria-live="polite">Hiển thị {filteredOfficers.length} / {officers.length} hồ sơ</p>
        {filteredOfficers.length === 0 ? (
          <Empty>{officers.length ? "Không có nhân viên phù hợp với điều kiện tìm kiếm." : "Chưa có tài khoản nhân viên nào."}</Empty>
        ) : (
          <div className="grid gap-2 xl:grid-cols-2">
            {filteredOfficers.map((officer) => (
              <button
                key={officer.id}
                type="button"
                onClick={() => setSelectedOfficerId(officer.id)}
                aria-label={`Mở hồ sơ ${officer.fullName}`}
                className="group flex min-h-[76px] w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-panel px-4 py-3 text-left transition-colors hover:border-sky-400/50 hover:bg-panel2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-police/40 bg-police/10 text-xs font-bold text-sky-100">
                    {officer.fullName.split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">{officer.fullName}</span>
                    <span className="mt-1 block truncate font-mono text-[11px] text-slate-500">
                      @{officer.username} · #{officer.badge}{officer.callsign ? ` · ${officer.callsign}` : ""}
                    </span>
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400">{officer.rank}</span>
                  <Badge tone={officer.active ? "ok" : "neutral"} dot>{officer.active ? "Đang hoạt động" : "Đã khóa"}</Badge>
                  {officer.onDuty && <Badge tone="info" dot>Đang trực</Badge>}
                  <span className="hidden text-xs font-semibold text-sky-300 group-hover:inline sm:inline">Mở hồ sơ</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {dialogOpen && (
        <div
          className="hr-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCreateOpen(false);
              setSelectedOfficerId(null);
            }
          }}
        >
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="personnel-dialog-title"
            tabIndex={-1}
            className="hr-modal-panel"
          >
            <header className="flex items-start justify-between gap-4 border-b border-line p-4 sm:p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300">
                  {createOpen ? "TẠO TÀI KHOẢN" : "HỒ SƠ NHÂN VIÊN"}
                </p>
                <h2 id="personnel-dialog-title" className="mt-1 text-lg font-semibold text-white">
                  {createOpen ? "Cấp tài khoản nhân viên" : selectedOfficer?.fullName}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {createOpen
                    ? "Thông tin đăng nhập được mã hóa; mật khẩu không hiển thị lại sau khi tạo."
                    : "Chỉnh sửa hồ sơ, quản lý quyền truy cập hoặc đặt lại mật khẩu."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreateOpen(false);
                  setSelectedOfficerId(null);
                }}
                aria-label="Đóng cửa sổ"
                className="btn min-h-10 min-w-10 shrink-0 p-0"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>
            <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto p-4 sm:p-5">
              {createOpen ? (
                <CreateOfficerForm />
              ) : selectedOfficer ? (
                <OfficerCard
                  officer={selectedOfficer}
                  hours={hoursByOfficer[selectedOfficer.id] ?? "0 giờ"}
                  isCurrent={selectedOfficer.id === currentOfficerId}
                  onDeactivated={onDeactivated}
                />
              ) : null}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
