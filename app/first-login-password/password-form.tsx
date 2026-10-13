"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { ArrowRight, Check, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { completeRequiredPasswordChange } from "@/app/mdt/actions";

type PasswordActionState = { status: "success" | "error"; message: string } | null;
const INITIAL_STATE: PasswordActionState = null;

function SubmitButton({ complete }: { complete: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || !complete}
      className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-sky-300 px-5 text-sm font-semibold text-slate-950 shadow-[0_10px_35px_-18px_rgba(56,189,248,0.8)] transition duration-200 hover:bg-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09111d] disabled:cursor-not-allowed disabled:opacity-50 motion-safe:hover:-translate-y-0.5"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
          Đang bảo vệ tài khoản...
        </>
      ) : (
        <>
          Hoàn tất và vào MDT
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </>
      )}
    </button>
  );
}

export function FirstLoginPasswordForm({ fullName }: { fullName: string }) {
  const [state, action] = useFormState(completeRequiredPasswordChange, INITIAL_STATE);
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const router = useRouter();

  const requirements = useMemo(() => ({
    length: newPassword.length >= 12 && newPassword.length <= 128,
    lower: /[a-z]/.test(newPassword),
    upper: /[A-Z]/.test(newPassword),
    number: /\d/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirmation,
  }), [confirmation, newPassword]);
  const ready = Object.values(requirements).every(Boolean);

  useEffect(() => {
    if (state?.status !== "success") return;
    const timeout = window.setTimeout(() => {
      router.replace("/mdt");
      router.refresh();
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [router, state]);

  return (
    <main className="password-gate relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-slate-100 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="password-gate-glow absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-sky-500/10 blur-[110px]" />
        <div className="password-gate-glow password-gate-glow-delay absolute -bottom-48 -right-32 h-[34rem] w-[34rem] rounded-full bg-indigo-500/10 blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <section
        aria-labelledby="password-gate-title"
        className="password-gate-card w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#101b2a]/95 shadow-[0_32px_100px_-35px_rgba(0,0,0,0.9)] backdrop-blur-xl"
      >
        <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-cyan-300 to-indigo-400" />
        <div className="p-6 sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-300/20 bg-sky-300/10 text-sky-200">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Novaris City · NCPD</p>
                <p className="mt-1 text-xs font-medium text-slate-300">Bảo mật tài khoản nhân sự</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
              <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
              Cần thiết lập
            </span>
          </div>

          <div className="mt-8">
            <p className="text-xs font-medium text-sky-200">Xin chào, {fullName}</p>
            <h1 id="password-gate-title" className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Tạo mật khẩu riêng của bạn
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">
              Đây là lần đăng nhập đầu tiên hoặc Ban Chỉ huy vừa cấp mật khẩu tạm. Hãy đổi sang mật khẩu riêng để mở quyền truy cập MDT.
            </p>
          </div>

          {state?.status === "success" ? (
            <div role="status" aria-live="polite" className="mt-8 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.07] p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-300/15 text-emerald-200">
                <Check className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-4 font-semibold text-emerald-100">Tài khoản đã được bảo vệ</p>
              <p className="mt-1 text-sm text-slate-400">{state.message}</p>
            </div>
          ) : (
            <form action={action} className="mt-7 space-y-5">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-300">Mật khẩu mới</span>
                  <span className="relative block">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                    <input
                      name="newPassword"
                      type={showPasswords ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      autoComplete="new-password"
                      minLength={12}
                      maxLength={128}
                      autoFocus
                      required
                      className="min-h-12 w-full rounded-lg border border-white/10 bg-[#080f19] py-3 pl-11 pr-12 text-sm text-white outline-none transition focus:border-sky-300/60 focus:ring-2 focus:ring-sky-300/10"
                      placeholder="Ít nhất 12 ký tự"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((shown) => !shown)}
                      className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                      aria-label={showPasswords ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      aria-pressed={showPasswords}
                    >
                      {showPasswords ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-300">Xác nhận mật khẩu mới</span>
                  <span className="relative block">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                    <input
                      name="confirmation"
                      type={showPasswords ? "text" : "password"}
                      value={confirmation}
                      onChange={(event) => setConfirmation(event.target.value)}
                      autoComplete="new-password"
                      minLength={12}
                      maxLength={128}
                      required
                      className="min-h-12 w-full rounded-lg border border-white/10 bg-[#080f19] px-11 py-3 text-sm text-white outline-none transition focus:border-sky-300/60 focus:ring-2 focus:ring-sky-300/10"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </span>
                </label>
              </div>

              <ul className="grid gap-x-5 gap-y-2 rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 text-xs sm:grid-cols-2" aria-label="Yêu cầu mật khẩu">
                {([
                  ["length", "Tối thiểu 12 ký tự"],
                  ["upper", "Có ít nhất một chữ hoa"],
                  ["lower", "Có ít nhất một chữ thường"],
                  ["number", "Có ít nhất một chữ số"],
                  ["match", "Hai mật khẩu trùng khớp"],
                ] as const).map(([key, label]) => (
                  <li key={key} className={`flex items-center gap-2 ${requirements[key] ? "text-emerald-200" : "text-slate-500"}`}>
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${requirements[key] ? "border-emerald-300/40 bg-emerald-300/10" : "border-slate-600"}`}>
                      {requirements[key] && <Check className="h-2.5 w-2.5" aria-hidden="true" />}
                    </span>
                    {label}
                  </li>
                ))}
              </ul>

              {state?.status === "error" && (
                <p role="alert" aria-live="polite" className="rounded-lg border border-red-300/20 bg-red-300/[0.07] px-3.5 py-3 text-xs leading-relaxed text-red-200">
                  {state.message}
                </p>
              )}

              <SubmitButton complete={ready} />
              <p className="text-center text-[11px] leading-relaxed text-slate-500">
                Cho phép trình quản lý mật khẩu tự động điền hoặc lưu mật khẩu mới.
              </p>
            </form>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 border-t border-white/[0.06] px-6 py-4 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Phiên làm việc được bảo vệ · NCPD MDT
        </div>
      </section>
    </main>
  );
}
