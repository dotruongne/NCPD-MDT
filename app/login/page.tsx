"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Shield, Lock, User, ShieldAlert, Radio, MapPin } from "lucide-react";
import { login } from "./actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { ToastOnChange } from "@/components/toast-provider";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="portal-submit flex min-h-12 w-full items-center justify-center gap-2 rounded-sm px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fa2] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
      disabled={pending}
    >
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Đang xác thực...
        </>
      ) : (
        "Đăng nhập hệ thống"
      )}
    </button>
  );
}

export default function LoginPage() {
  const [state, action] = useFormState(login, null);

  return (
    <div className="portal-page flex min-h-screen flex-col">
      <div className="portal-topline h-2 bg-[#173b60]" />
      <header className="portal-header border-b">
        <div className="mx-auto flex min-h-[92px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-4">
            <div className="portal-logo flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2">
              <Shield className="h-7 w-7" strokeWidth={1.7} />
            </div>
            <div>
              <p className="portal-muted text-[11px] font-semibold uppercase tracking-[0.16em]">Novaris City</p>
              <p className="portal-heading mt-0.5 text-lg font-bold tracking-[-0.02em]">Sở Cảnh sát Novaris City (NCPD)</p>
              <p className="portal-muted mt-0.5 hidden text-[10px] font-medium uppercase tracking-[0.14em] sm:block">Trụ sở NCPD · Cổng dịch vụ nội bộ</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden border-l border-[#d9dee5] pl-5 text-right sm:block">
              <p className="portal-muted text-[10px] font-semibold uppercase tracking-[0.12em]">Hệ thống nghiệp vụ</p>
              <p className="portal-title mt-1 text-xs font-medium">Mobile Data Terminal</p>
            </div>
            <ThemeToggle className="portal-theme-toggle" />
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 content-center gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1fr_440px] lg:items-center lg:gap-20 lg:py-20">
        <section className="max-w-2xl">
          <div className="portal-status mb-5 inline-flex items-center gap-2 border-l-[3px] border-[#a43b3b] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            Mạng nội bộ · Kết nối bảo mật
          </div>
          <h1 className="portal-heading max-w-xl text-3xl font-bold leading-tight tracking-[-0.035em] sm:text-4xl lg:text-[46px]">
            Trung tâm chỉ huy
            <span className="portal-blue mt-1 block">và dữ liệu nghiệp vụ</span>
          </h1>
          <p className="portal-copy mt-5 max-w-xl text-sm leading-7 sm:text-base">
            Công cụ dành cho nhân sự được ủy quyền để điều phối cuộc gọi, tra cứu hồ sơ và ghi nhận hoạt động của đơn vị.
          </p>

          <div className="mt-9 grid gap-3 sm:grid-cols-2">
            <div className="portal-card border-t-[3px] border-t-[#244f75] p-4">
              <Radio className="portal-blue h-5 w-5" strokeWidth={1.8} />
              <p className="portal-title mt-3 text-sm font-semibold">Điều phối tập trung</p>
              <p className="portal-muted mt-1 text-xs leading-5">Theo dõi cuộc gọi, đơn vị và trạng thái xử lý.</p>
            </div>
            <div className="portal-card border-t-[3px] border-t-[#a43b3b] p-4">
              <MapPin className="portal-red h-5 w-5" strokeWidth={1.8} />
              <p className="portal-title mt-3 text-sm font-semibold">Trụ sở NCPD · Novaris City</p>
              <p className="portal-muted mt-1 text-xs leading-5">Hệ thống tác nghiệp nội bộ của Sở Cảnh sát.</p>
            </div>
          </div>
          <p className="portal-muted mt-8 border-t border-[#d9dee5] pt-4 text-[11px] leading-relaxed">
            Chỉ dành cho mục đích nhập vai và vận hành nội bộ trong máy chủ. Đây không phải cổng dịch vụ của cơ quan chính phủ có thật.
          </p>
        </section>

        <section className="portal-panel portal-card shadow-[0_12px_36px_-24px_rgba(15,35,55,0.4)]">
          <div className="portal-panel-head border-b border-t-[4px] border-t-[#173b60] px-6 py-6 sm:px-8">
            <p className="portal-muted text-[10px] font-bold uppercase tracking-[0.15em]">Truy cập nhân sự</p>
            <h2 className="portal-heading mt-2 text-2xl font-bold tracking-[-0.025em]">Đăng nhập MDT</h2>
            <p className="portal-muted mt-2 text-[13px] leading-relaxed">Sử dụng thông tin đăng nhập do Ban Chỉ huy cấp.</p>
          </div>

          <div className="px-6 py-6 sm:px-8">
            <div className="portal-status mb-6 flex items-center justify-between border px-3.5 py-3">
              <span className="flex items-center gap-2 text-xs font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                Hệ thống sẵn sàng
              </span>
              <span className="portal-muted font-mono text-[10px]">TERMINAL 01</span>
            </div>

            <form action={action} className="space-y-4">
              <div>
                <label className="portal-title mb-1.5 block text-xs font-semibold">Tài khoản sĩ quan</label>
                <div className="relative">
                  <User className="portal-muted pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
                  <input
                    name="username"
                    className="portal-input min-h-11 w-full rounded-sm border py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2"
                    placeholder="Nhập tên tài khoản"
                    autoComplete="username"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="portal-title mb-1.5 block text-xs font-semibold">Mật khẩu</label>
                <div className="relative">
                  <Lock className="portal-muted pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
                  <input
                    name="password"
                    type="password"
                    className="portal-input min-h-11 w-full rounded-sm border py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2"
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <div className="pt-1">
                <SubmitButton />
              </div>
            </form>
            <ToastOnChange eventKey={state} message={state?.error} type="error" title="Đăng nhập thất bại" />

            <div className="portal-caution mt-6 border-l-[3px] border-[#b28a35] px-3.5 py-3">
              <div className="portal-caution-title flex items-center gap-2 text-[11px] font-bold">
                <ShieldAlert className="h-4 w-4" /> Truy cập được kiểm soát
              </div>
              <p className="portal-muted mt-1.5 text-[11px] leading-relaxed">
                Dữ liệu chỉ dành cho nhân sự được cấp quyền. Hoạt động truy cập có thể được ghi nhận.
              </p>
            </div>

            <div className="portal-panel-foot mt-6 flex items-center justify-end border-t pt-4">
              <span className="portal-muted text-[10px] font-medium uppercase tracking-[0.1em]">NCPD · MDT</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="portal-footer border-t">
        <div className="portal-muted mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4 text-[10px] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>NCPD Novaris City · Mạng tác nghiệp nội bộ</span>
          <span>Chỉ dành cho nhân sự được ủy quyền</span>
        </div>
      </footer>
    </div>
  );
}
