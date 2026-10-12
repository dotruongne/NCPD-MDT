"use client";

import { useFormState, useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import { Field } from "@/components/ui";
import { submitApplication } from "@/app/(public)/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="portal-submit inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-5 py-3 text-sm font-semibold transition hover:brightness-110 disabled:opacity-60" disabled={pending}>
      <Send className="h-4 w-4" /> {pending ? "Đang gửi hồ sơ..." : "Gửi đơn đăng ký"}
    </button>
  );
}

function RequiredCommitment({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <label className="portal-commitment flex cursor-pointer items-start gap-3 rounded-sm border p-3 text-sm leading-6">
      <input className="mt-1 h-4 w-4 shrink-0 accent-[#244f75]" type="checkbox" name={name} required />
      <span className="portal-copy">{children}</span>
    </label>
  );
}

export function RecruitmentApplicationForm() {
  const [state, action] = useFormState(submitApplication, null);
  if (state?.trackingCode) {
    return (
      <div className="portal-status border-l-[3px] border-emerald-600 p-5" role="status">
        <CheckCircle2 className="mb-3 h-6 w-6 text-emerald-600" />
        <h2 className="portal-title font-semibold">Đã tiếp nhận đơn đăng ký</h2>
        <p className="portal-copy mt-1 text-sm leading-6">Hãy lưu mã theo dõi để Ban Tuyển dụng tra cứu hồ sơ.</p>
        <p className="mt-3 inline-block rounded-sm border border-emerald-700/30 px-3 py-2 font-mono text-sm font-bold tracking-wider text-emerald-700 dark:text-emerald-300">{state.trackingCode}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-7">
      {state?.error && (
        <div className="portal-error flex items-start gap-2 border p-3 text-sm" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{state.error}
        </div>
      )}

      <section className="space-y-4">
        <div className="portal-form-section-title"><span>I</span><h3>Thông tin ứng viên</h3></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Họ và tên (OC)" required><input className="portal-input min-h-11 w-full rounded-sm border px-3 text-sm" name="ocName" autoComplete="name" maxLength={100} required /></Field>
          <Field label="Tên nhân vật (IC)" required><input className="portal-input min-h-11 w-full rounded-sm border px-3 text-sm" name="icName" maxLength={100} required /></Field>
          <Field label="Tuổi ứng viên" required><input className="portal-input min-h-11 w-full rounded-sm border px-3 text-sm" name="age" type="number" min={1} max={100} required /></Field>
          <Field label="Giới tính" required>
            <select className="portal-input min-h-11 w-full rounded-sm border px-3 text-sm" name="gender" required defaultValue="">
              <option value="" disabled>Chọn giới tính</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
              <option value="Không muốn tiết lộ">Không muốn tiết lộ</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Discord liên hệ" required hint="Dùng để Ban Tuyển dụng phản hồi">
              <input className="portal-input min-h-11 w-full rounded-sm border px-3 text-sm" name="discord" maxLength={100} placeholder="Tên người dùng Discord" required />
            </Field>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="portal-form-section-title"><span>II</span><h3>Thông tin tuyển dụng</h3></div>
        <Field label="Bạn đã từng tham gia NCPD hoặc lực lượng nào khác chưa? Đã nắm giữ vị trí, chức vụ gì?" required hint="10–2.000 ký tự">
          <textarea className="portal-input min-h-24 w-full rounded-sm border p-3 text-sm" name="priorService" minLength={10} maxLength={2000} required placeholder="Nếu chưa từng tham gia, hãy ghi rõ." />
        </Field>
        <Field label="Bạn có kinh nghiệm Roleplay không? Hãy mô tả một tình huống ngắn gọn." required hint="20–3.000 ký tự">
          <textarea className="portal-input min-h-28 w-full rounded-sm border p-3 text-sm" name="roleplayScenario" minLength={20} maxLength={3000} required />
        </Field>
        <Field label="Lý do bạn muốn gia nhập NCPD" required hint="20–2.000 ký tự">
          <textarea className="portal-input min-h-24 w-full rounded-sm border p-3 text-sm" name="motivation" minLength={20} maxLength={2000} required />
        </Field>
        <Field label="Bạn mong muốn đạt được điều gì khi trở thành sĩ quan NCPD?" required hint="10–2.000 ký tự">
          <textarea className="portal-input min-h-24 w-full rounded-sm border p-3 text-sm" name="careerGoals" minLength={10} maxLength={2000} required />
        </Field>
        <Field label="Điểm mạnh và điểm yếu của bạn" required hint="10–2.000 ký tự">
          <textarea className="portal-input min-h-24 w-full rounded-sm border p-3 text-sm" name="strengthsWeaknesses" minLength={10} maxLength={2000} required />
        </Field>
      </section>

      <section className="space-y-4">
        <div className="portal-form-section-title"><span>III</span><h3>Thời gian hoạt động</h3></div>
        <Field label="Khung giờ bạn thường xuyên có mặt trong thành phố" required hint="Múi giờ địa phương">
          <input className="portal-input min-h-11 w-full rounded-sm border px-3 text-sm" name="activityHours" minLength={2} maxLength={200} required placeholder="Ví dụ: 19:00–23:00, GMT+7" />
        </Field>
        <Field label="Bạn có thể tham gia ca trực tối thiểu bao nhiêu giờ mỗi ngày?" required>
          <input className="portal-input min-h-11 w-full rounded-sm border px-3 text-sm sm:max-w-xs" name="minimumDutyHours" minLength={1} maxLength={100} required placeholder="Ví dụ: 2 giờ/ngày" />
        </Field>
        <RequiredCommitment name="trainingCommitment">Tôi sẵn sàng tham gia các buổi huấn luyện của NCPD.</RequiredCommitment>
      </section>

      <section className="space-y-4">
        <div className="portal-form-section-title"><span>IV</span><h3>Cam kết</h3></div>
        <RequiredCommitment name="rulesCommitment">Tôi đồng ý tuân thủ nội quy NCPD và quy định của Novaris City.</RequiredCommitment>
        <RequiredCommitment name="conductCommitment">Tôi cam kết duy trì thái độ nghiêm túc, tôn trọng cư dân và đồng đội trong quá trình công tác.</RequiredCommitment>
        <RequiredCommitment name="trainingCompletionCommitment">Nếu được tuyển dụng, tôi cam kết hoàn thành đầy đủ chương trình đào tạo trước khi chính thức nhận công việc.</RequiredCommitment>
        <div className="portal-penalty-notice border-l-[3px] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.1em]">Cam kết hoạt động tối thiểu · Quy định nhập vai NOVARIS CITY</p>
          <p className="mt-2 text-sm leading-6">Tôi đã đọc và hiểu quy định: nếu không đảm bảo hoạt động theo cam kết hoặc rời lực lượng trước khi hoàn thành 2 tuần công tác, mức xử lý trong game là 200 tháng tù liên bang theo quy định NOVARIS CITY.</p>
          <div className="mt-3"><RequiredCommitment name="earlyDeparturePenaltyCommitment">Tôi xác nhận đã đọc và đồng ý với cam kết hoạt động tối thiểu nêu trên.</RequiredCommitment></div>
        </div>
        <div className="portal-declaration border p-4">
          <p className="portal-title text-xs font-bold uppercase tracking-[0.1em]">Lời cam kết của ứng viên</p>
          <p className="portal-copy mt-2 text-sm leading-6">Tôi xác nhận những thông tin cung cấp trong đơn đăng ký là chính xác. Tôi hiểu rằng gia nhập NCPD là trách nhiệm đối với thành phố và cam kết tuân thủ các quy định của Novaris City cũng như điều lệ của lực lượng.</p>
          <div className="mt-3"><RequiredCommitment name="applicantDeclaration">Tôi xác nhận lời cam kết trên và chịu trách nhiệm về thông tin đã khai.</RequiredCommitment></div>
        </div>
      </section>

      <div className="border-t pt-5">
        <p className="portal-muted mb-4 text-xs leading-5">Chỉ cung cấp thông tin phục vụ nhập vai và phương thức liên hệ trong cộng đồng. Không nhập mật khẩu, giấy tờ thật hoặc dữ liệu nhạy cảm ngoài đời.</p>
        <SubmitButton />
      </div>
    </form>
  );
}
