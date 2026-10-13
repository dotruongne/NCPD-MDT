import { Radio, ShieldCheck } from "lucide-react";

export function NcpdLoading({ detail = "Đang kết nối hệ thống nghiệp vụ" }: { detail?: string }) {
  return (
    <main className="ncpd-loading-screen" aria-busy="true">
      <section className="ncpd-loading" role="status" aria-live="polite">
        <div className="ncpd-loading-topline">
          <span>NC</span>
          <span>NOVARIS CITY POLICE DEPARTMENT</span>
          <span>MDT / 01</span>
        </div>
        <div className="ncpd-loading-core">
          <div className="ncpd-loading-radar" aria-hidden="true">
            <span className="ncpd-radar-ring ncpd-radar-ring-one" />
            <span className="ncpd-radar-ring ncpd-radar-ring-two" />
            <span className="ncpd-radar-sweep" />
            <span className="ncpd-radar-mark ncpd-radar-mark-one" />
            <span className="ncpd-radar-mark ncpd-radar-mark-two" />
            <ShieldCheck className="ncpd-loading-shield" strokeWidth={1.35} />
          </div>
          <div className="ncpd-loading-copy">
            <p className="ncpd-loading-eyebrow"><Radio className="h-3.5 w-3.5" aria-hidden="true" /> SECURE LINK · ACTIVE</p>
            <h1>NCPD <span>MDT</span></h1>
            <p className="ncpd-loading-detail">{detail}</p>
          </div>
        </div>
        <div className="ncpd-loading-progress" aria-hidden="true"><span /></div>
        <div className="ncpd-loading-foot">
          <span>ĐANG TẢI DỮ LIỆU</span>
          <span className="ncpd-loading-dots"><i /><i /><i /></span>
          <span>ĐỪNG GỬI LẠI YÊU CẦU</span>
        </div>
        <span className="sr-only">Trang đang tải. Vui lòng chờ.</span>
      </section>
    </main>
  );
}