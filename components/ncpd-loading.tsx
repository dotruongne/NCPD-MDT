import { ShieldCheck } from "lucide-react";

export function NcpdLoading({ detail = "Đang kết nối hệ thống nghiệp vụ" }: { detail?: string }) {
  return (
    <main className="ncpd-loading-screen" aria-busy="true">
      <section className="ncpd-loading" role="status" aria-live="polite">
        <div className="ncpd-loading-spinner" aria-hidden="true">
          <span className="ncpd-loading-spinner-track" />
          <span className="ncpd-loading-spinner-arc" />
          <ShieldCheck className="ncpd-loading-shield" strokeWidth={1.6} />
        </div>
        <h1 className="ncpd-loading-title">NCPD <span>đang tải</span></h1>
        <p className="ncpd-loading-detail">{detail}</p>
      </section>
    </main>
  );
}