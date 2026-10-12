import Link from "next/link";
import { ArrowRight, BookOpen, BriefcaseBusiness, Landmark, Shield, Siren } from "lucide-react";

export default function HomePage() {
  return (
    <main className="portal-view-enter">
      <section className="mx-auto grid min-h-[calc(100vh-145px)] max-w-7xl content-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="portal-status mb-5 inline-flex items-center gap-2 border-l-[3px] border-[#a43b3b] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em]">
            <Landmark className="h-4 w-4" /> Cổng thông tin Novaris City
          </div>
          <h1 className="portal-heading max-w-2xl text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-5xl lg:text-[58px]">
            Dịch vụ công dân
            <span className="portal-blue mt-2 block">Novaris City</span>
          </h1>
          <p className="portal-copy mt-6 max-w-xl text-base leading-8">
            Tra cứu luật thành phố, tìm hiểu quy trình tuyển dụng và kết nối với các cơ quan công quyền trong thành phố.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/laws" className="portal-submit inline-flex min-h-11 items-center gap-2 rounded-sm px-5 py-3 text-sm font-semibold transition hover:brightness-110">
              Tra cứu luật thành phố <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/recruitment" className="portal-surface inline-flex min-h-11 items-center gap-2 rounded-sm border px-5 py-3 text-sm font-semibold transition hover:border-slate-400">
              Tuyển dụng NCPD <BriefcaseBusiness className="h-4 w-4" />
            </Link>
          </div>
          <p className="portal-muted mt-8 max-w-xl border-t pt-4 text-xs leading-6">
            Đây là cổng phục vụ cộng đồng nhập vai FiveM. Các quy định và mức phạt chỉ áp dụng trong máy chủ Novaris City Roleplay.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/laws" className="portal-card group border-t-[3px] border-t-[#244f75] p-5 transition hover:-translate-y-1">
            <BookOpen className="portal-blue h-6 w-6" />
            <h2 className="portal-title mt-4 font-semibold">Bộ luật thành phố</h2>
            <p className="portal-muted mt-2 text-sm leading-6">Danh mục hành vi vi phạm, mức phạt và thời gian giam giữ.</p>
            <span className="portal-link mt-4 inline-flex items-center gap-1 text-xs font-semibold">Xem bộ luật <ArrowRight className="h-3.5 w-3.5" /></span>
          </Link>
          <Link href="/recruitment" className="portal-card group border-t-[3px] border-t-[#a43b3b] p-5 transition hover:-translate-y-1 sm:mt-10">
            <Shield className="portal-red h-6 w-6" />
            <h2 className="portal-title mt-4 font-semibold">Gia nhập Sở Cảnh sát</h2>
            <p className="portal-muted mt-2 text-sm leading-6">Tìm hiểu điều kiện, quy trình và gửi hồ sơ ứng tuyển trực tuyến.</p>
            <span className="portal-link mt-4 inline-flex items-center gap-1 text-xs font-semibold">Ứng tuyển <ArrowRight className="h-3.5 w-3.5" /></span>
          </Link>
          <div className="portal-card border p-5 sm:col-span-2">
            <div className="flex items-start gap-3">
              <Siren className="portal-red mt-0.5 h-5 w-5" />
              <div>
                <h2 className="portal-title text-sm font-semibold">Thông báo dành cho cư dân</h2>
                <p className="portal-muted mt-1 text-sm leading-6">Cổng công dân chỉ hiển thị thông tin công khai và biểu mẫu tuyển dụng. Hồ sơ nghiệp vụ của sĩ quan được bảo vệ riêng trong MDT.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
