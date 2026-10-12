import Link from "next/link";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, ChevronRight, CircleHelp, ClipboardCheck, FileCheck2, Landmark, ShieldCheck, UserPlus } from "lucide-react";
import { RecruitmentApplicationForm } from "@/components/recruitment-application-form";

export default function RecruitmentPage() {
  const steps = [
    ["01", "Nộp hồ sơ", "Điền thông tin ứng viên và gửi biểu mẫu trực tuyến.", FileCheck2],
    ["02", "Xét duyệt", "Ban Tuyển dụng xem xét hồ sơ và liên hệ qua Discord.", ClipboardCheck],
    ["03", "Phỏng vấn", "Trao đổi về quy định, quy trình và kỳ vọng nhập vai.", CircleHelp],
    ["04", "Đào tạo", "Bắt đầu chương trình huấn luyện cùng sĩ quan hướng dẫn.", BadgeCheck],
  ] as const;

  return (
    <main className="portal-view-enter service-page mx-auto min-h-[calc(100vh-165px)] max-w-7xl px-5 py-8 sm:px-8">
      <nav className="service-breadcrumb" aria-label="Điều hướng">
        <Link href="/">Trang chủ</Link><ChevronRight aria-hidden="true" /><span aria-current="page">Tuyển dụng NCPD</span>
      </nav>

      <section className="service-hero recruitment-hero">
        <div className="service-hero-copy">
          <p className="service-eyebrow"><Landmark aria-hidden="true" /> SỞ CẢNH SÁT NOVARIS CITY</p>
          <h1>Tuyển dụng NCPD</h1>
          <p className="service-lead">Cùng xây dựng một cộng đồng nhập vai an toàn, chuyên nghiệp và đáng nhớ. Tìm hiểu quy trình và gửi hồ sơ ứng tuyển trực tuyến.</p>
          <a className="service-primary-link" href="#ho-so-ung-tuyen">Bắt đầu ứng tuyển <ArrowRight aria-hidden="true" /></a>
        </div>
        <div className="service-hero-seal recruitment-seal" aria-hidden="true"><BriefcaseBusiness /></div>
        <div className="service-hero-meta">
          <span><ShieldCheck aria-hidden="true" /> Hồ sơ chỉ phục vụ hoạt động nhập vai</span>
          <span><UserPlus aria-hidden="true" /> Tiếp nhận hồ sơ trực tuyến</span>
        </div>
      </section>

      <div className="service-breadcrumb service-breadcrumb-secondary" aria-hidden="true">
        <span>THỦ TỤC VÀ THÔNG TIN</span><ChevronRight /><span>TUYỂN DỤNG</span>
      </div>

      <section className="service-process" aria-labelledby="recruitment-process-heading">
        <div className="service-section-heading">
          <div><span className="service-section-kicker">CÁC BƯỚC THỰC HIỆN</span><h2 id="recruitment-process-heading">Quy trình tuyển dụng</h2></div>
          <span className="service-process-caption"><ClipboardCheck aria-hidden="true" /> 4 bước rõ ràng</span>
        </div>
        <ol className="service-process-list">
          {steps.map(([number, title, description, Icon]) => (
            <li key={number} className="service-process-step">
              <span className="service-step-number">{number}</span>
              <span className="service-step-icon"><Icon aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="service-application-layout">
        <aside className="service-application-aside">
          <section className="service-side-panel">
            <span className="service-section-kicker">TRƯỚC KHI ỨNG TUYỂN</span>
            <h2>Chuẩn bị thông tin</h2>
            <p>Hãy chuẩn bị thông tin nhân vật, khung giờ hoạt động và tên Discord để Ban Tuyển dụng có thể liên hệ.</p>
            <ul>
              <li><BadgeCheck aria-hidden="true" /> Điền đầy đủ các mục có dấu *</li>
              <li><BadgeCheck aria-hidden="true" /> Dùng Discord có thể nhận tin nhắn</li>
              <li><BadgeCheck aria-hidden="true" /> Lưu mã theo dõi sau khi gửi</li>
            </ul>
          </section>
          <section className="service-security-note">
            <ShieldCheck aria-hidden="true" />
            <div><h2>Lưu ý bảo mật</h2><p>Chỉ cung cấp thông tin phục vụ nhập vai. Không gửi mật khẩu, giấy tờ hoặc dữ liệu cá nhân thật.</p></div>
          </section>
        </aside>

        <section id="ho-so-ung-tuyen" className="service-application">
          <header className="service-records-heading">
            <span className="service-records-icon"><UserPlus aria-hidden="true" /></span>
            <div><span className="service-section-kicker">BIỂU MẪU TRỰC TUYẾN</span><h2>Hồ sơ ứng tuyển</h2><p>Các mục có dấu * là bắt buộc. Thời gian phản hồi tùy thuộc hoạt động của Ban Tuyển dụng.</p></div>
          </header>
          <div className="service-application-form"><RecruitmentApplicationForm /></div>
        </section>
      </div>
    </main>
  );
}
