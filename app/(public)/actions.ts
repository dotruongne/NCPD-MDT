"use server";

import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";

const applicationSchema = z.object({
  ocName: z.string().trim().min(2, "Nhập họ tên OC hợp lệ.").max(100),
  icName: z.string().trim().min(2, "Nhập tên nhân vật IC hợp lệ.").max(100),
  discord: z.string().trim().min(2, "Nhập Discord liên hệ.").max(100),
  age: z.number().int().min(1, "Tuổi không hợp lệ.").max(100, "Tuổi không hợp lệ."),
  gender: z.string().trim().min(1, "Chọn giới tính.").max(40),
  priorService: z.string().trim().min(10, "Mô tả kinh nghiệm lực lượng (hoặc ghi chưa từng tham gia) ít nhất 10 ký tự.").max(2000),
  roleplayScenario: z.string().trim().min(20, "Mô tả tình huống Roleplay ít nhất 20 ký tự.").max(3000),
  motivation: z.string().trim().min(20, "Lý do gia nhập ít nhất 20 ký tự.").max(2000),
  careerGoals: z.string().trim().min(10, "Mô tả mục tiêu ít nhất 10 ký tự.").max(2000),
  strengthsWeaknesses: z.string().trim().min(10, "Mô tả điểm mạnh và điểm yếu ít nhất 10 ký tự.").max(2000),
  activityHours: z.string().trim().min(2, "Cho biết khung giờ thường hoạt động.").max(200),
  minimumDutyHours: z.string().trim().min(1, "Cho biết số giờ trực tối thiểu mỗi ngày.").max(100),
  trainingCommitment: z.literal(true, { errorMap: () => ({ message: "Xác nhận bạn sẵn sàng tham gia huấn luyện." }) }),
  rulesCommitment: z.literal(true, { errorMap: () => ({ message: "Bạn cần đồng ý tuân thủ nội quy NCPD và Novaris City." }) }),
  conductCommitment: z.literal(true, { errorMap: () => ({ message: "Bạn cần cam kết thái độ nghiêm túc và tôn trọng." }) }),
  trainingCompletionCommitment: z.literal(true, { errorMap: () => ({ message: "Bạn cần cam kết hoàn thành chương trình đào tạo." }) }),
  earlyDeparturePenaltyCommitment: z.literal(true, { errorMap: () => ({ message: "Bạn cần xác nhận đã đọc cam kết hoạt động tối thiểu." }) }),
  applicantDeclaration: z.literal(true, { errorMap: () => ({ message: "Bạn cần xác nhận lời cam kết của ứng viên." }) }),
});

export async function submitApplication(
  _: { error?: string; trackingCode?: string } | null,
  formData: FormData
) {
  const parsed = applicationSchema.safeParse({
    ocName: String(formData.get("ocName") ?? ""),
    icName: String(formData.get("icName") ?? ""),
    discord: String(formData.get("discord") ?? ""),
    age: Number(formData.get("age")),
    gender: String(formData.get("gender") ?? ""),
    priorService: String(formData.get("priorService") ?? ""),
    roleplayScenario: String(formData.get("roleplayScenario") ?? ""),
    motivation: String(formData.get("motivation") ?? ""),
    careerGoals: String(formData.get("careerGoals") ?? ""),
    strengthsWeaknesses: String(formData.get("strengthsWeaknesses") ?? ""),
    activityHours: String(formData.get("activityHours") ?? ""),
    minimumDutyHours: String(formData.get("minimumDutyHours") ?? ""),
    trainingCommitment: formData.get("trainingCommitment") === "on",
    rulesCommitment: formData.get("rulesCommitment") === "on",
    conductCommitment: formData.get("conductCommitment") === "on",
    trainingCompletionCommitment: formData.get("trainingCompletionCommitment") === "on",
    earlyDeparturePenaltyCommitment: formData.get("earlyDeparturePenaltyCommitment") === "on",
    applicantDeclaration: formData.get("applicantDeclaration") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const trackingCode = `NCPD-${randomBytes(5).toString("hex").toUpperCase()}`;
  const { icName, motivation, priorService, roleplayScenario, ...answers } = parsed.data;
  await db.application.create({
    data: {
      ...answers,
      fullName: icName,
      experience: `Kinh nghiệm lực lượng: ${priorService}\n\nTình huống Roleplay: ${roleplayScenario}`,
      reason: motivation,
      trackingCode,
    },
  });
  return { trackingCode };
}
