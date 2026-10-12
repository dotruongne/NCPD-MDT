import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight, Clock3, FileText, Landmark, Scale, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { money } from "@/lib/utils";
import { Empty } from "@/components/ui";

export default async function CityLawsPage() {
  const charges = await db.charge.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { code: "asc" }],
    select: { id: true, code: true, title: true, category: true, fine: true, jailMinutes: true, description: true },
  });
  const groups = [...new Set(charges.map((charge) => charge.category))];
  return (
    <main className="portal-view-enter service-page mx-auto min-h-[calc(100vh-165px)] max-w-7xl px-5 py-8 sm:px-8">
      <nav className="service-breadcrumb" aria-label="Điều hướng">
        <Link href="/">Trang chủ</Link><ChevronRight aria-hidden="true" /><span aria-current="page">Bộ luật</span>
      </nav>

      <section className="service-hero">
        <div className="service-hero-copy">
          <p className="service-eyebrow"><Landmark aria-hidden="true" /> CỔNG THÔNG TIN NOVARIS CITY</p>
          <h1>Bộ luật thành phố</h1>
          <p className="service-lead">Tra cứu danh mục hành vi vi phạm và khung xử lý đang được áp dụng trong hoạt động nhập vai tại Novaris City.</p>
          <a className="service-primary-link" href="#danh-muc-bo-luat">Tra cứu danh mục <ArrowRight aria-hidden="true" /></a>
        </div>
        <div className="service-hero-seal" aria-hidden="true"><Scale /></div>
        <div className="service-hero-meta">
          <span><ShieldCheck aria-hidden="true" /> Dữ liệu từ hệ thống nghiệp vụ NCPD</span>
          <span><Clock3 aria-hidden="true" /> Danh mục đang có hiệu lực</span>
        </div>
      </section>

      <div className="service-breadcrumb service-breadcrumb-secondary" aria-hidden="true">
        <span>THỦ TỤC VÀ THÔNG TIN</span><ChevronRight /><span>BỘ LUẬT</span>
      </div>

      <section className="service-summary" aria-label="Tổng quan bộ luật">
        <div className="service-summary-item"><span className="service-summary-icon"><FileText aria-hidden="true" /></span><span><strong>{charges.length}</strong><small>Quy định đang áp dụng</small></span></div>
        <div className="service-summary-item"><span className="service-summary-icon"><BookOpen aria-hidden="true" /></span><span><strong>{groups.length}</strong><small>Nhóm danh mục</small></span></div>
        <p><Scale aria-hidden="true" /> Mức phạt được tính theo đơn vị nhập vai của thành phố.</p>
      </section>

      {groups.length > 0 && (
        <nav id="danh-muc-bo-luat" className="service-category-nav" aria-label="Danh mục bộ luật">
          <div><strong>Danh mục</strong><span>Chọn nhóm để xem các quy định</span></div>
          <div className="service-category-links">
            {groups.map((category, index) => <a key={category} href={`#law-category-${index + 1}`}>{category}<ChevronRight aria-hidden="true" /></a>)}
          </div>
        </nav>
      )}

      <div className="service-notice" role="note">
        <Scale aria-hidden="true" />
        <p><strong>Lưu ý:</strong> Mức phạt và thời gian giam giữ là hướng dẫn trong game, có thể được điều chỉnh theo quy định máy chủ. Nội dung này không phải tư vấn pháp lý ngoài đời thực.</p>
      </div>

      {charges.length === 0 ? (
        <section className="service-records"><Empty icon={<BookOpen className="h-7 w-7" />}>Bộ luật đang được cập nhật.</Empty></section>
      ) : (
        <div className="service-law-groups">
          {groups.map((category, index) => {
            const categoryCharges = charges.filter((charge) => charge.category === category);
            return (
              <section key={category} id={`law-category-${index + 1}`} className="service-records">
                <header className="service-records-heading">
                  <span className="service-records-icon"><BookOpen aria-hidden="true" /></span>
                  <div><span className="service-section-kicker">DANH MỤC {String(index + 1).padStart(2, "0")}</span><h2>{category}</h2></div>
                  <span className="service-record-count">{categoryCharges.length} quy định</span>
                </header>
                <div className="service-law-list">
                  {categoryCharges.map((charge) => (
                    <article key={charge.id} className="service-law-row">
                      <span className="service-law-code">{charge.code}</span>
                      <div className="service-law-copy">
                        <h3>{charge.title}</h3>
                        {charge.description && <p>{charge.description}</p>}
                      </div>
                      <div className="service-law-penalties">
                        {charge.fine > 0 && <span className="service-penalty service-penalty-fine">Mức phạt<strong>{money(charge.fine)}</strong></span>}
                        {charge.jailMinutes > 0 && <span className="service-penalty service-penalty-jail">Giam giữ<strong>{charge.jailMinutes} phút</strong></span>}
                        {charge.fine === 0 && charge.jailMinutes === 0 && <span className="service-penalty service-penalty-none">Không có mức phạt cố định</span>}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
