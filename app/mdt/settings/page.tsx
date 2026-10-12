import { KeyRound, ShieldCheck } from "lucide-react";
import { Card, Field, PageTitle } from "@/components/ui";
import { requireOfficer } from "@/lib/auth";
import { changePassword, revokeAllSessions } from "../actions";

export default async function SecuritySettingsPage() {
  const officer = await requireOfficer();
  return (
    <div className="space-y-6">
      <PageTitle tag="ACCOUNT SECURITY" sub={`Bảo mật tài khoản sĩ quan ${officer.fullName}. Đổi mật khẩu sẽ kết thúc mọi phiên đăng nhập hiện có.`}>
        Bảo mật tài khoản
      </PageTitle>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Đổi mật khẩu" icon={<KeyRound className="h-4 w-4 text-sky-200" />} subtitle="Tối thiểu 12 ký tự, bao gồm chữ hoa, chữ thường và số.">
          <form action={changePassword} className="space-y-4 p-4">
            <Field label="Mật khẩu hiện tại" required><input className="input" type="password" name="currentPassword" autoComplete="current-password" required /></Field>
            <Field label="Mật khẩu mới" required><input className="input" type="password" name="newPassword" minLength={12} maxLength={128} autoComplete="new-password" required /></Field>
            <Field label="Nhập lại mật khẩu mới" required><input className="input" type="password" name="confirmation" minLength={12} maxLength={128} autoComplete="new-password" required /></Field>
            <button className="btn btn-neon px-4 py-2 text-sm font-semibold">Đổi mật khẩu và đăng nhập lại</button>
          </form>
        </Card>
        <Card title="Phiên đăng nhập" icon={<ShieldCheck className="h-4 w-4 text-emerald-300" />} subtitle="Thu hồi phiên hiện tại và mọi thiết bị/phiên đăng nhập khác.">
          <form action={revokeAllSessions} className="space-y-4 p-4">
            <p className="text-sm leading-relaxed text-slate-400">Dùng thao tác này khi nghi ngờ tài khoản đang mở trên thiết bị khác. Bạn sẽ được chuyển về màn hình đăng nhập.</p>
            <button className="btn btn-danger px-4 py-2 text-sm font-semibold">Khóa mọi phiên và đăng xuất</button>
          </form>
        </Card>
      </div>
      <Card title="Chính sách đăng nhập">
        <div className="space-y-2 p-4 text-sm text-slate-400">
          <p>Sau 5 lần đăng nhập thất bại liên tiếp, tài khoản bị khóa tạm thời 15 phút.</p>
          <p>Phiên đăng nhập được ký bằng cookie HttpOnly và hết hạn sau 12 giờ.</p>
          <p>Đổi mật khẩu hoặc thu hồi phiên sẽ vô hiệu hóa token đã cấp trước đó.</p>
        </div>
      </Card>
    </div>
  );
}
