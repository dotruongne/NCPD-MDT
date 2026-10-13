"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { destroySession, requireOfficer, requirePersonnelManager, requireRole } from "@/lib/auth";
import { hasFinanceAccess, hasFtoAccess, hasPersonnelManagement } from "@/lib/roles";
import { dutyHoursInPeriod } from "@/lib/utils";
import { auditedMutation, recordAudit } from "@/lib/audit";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function parseCalendarDate(value: string, field: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${field} không hợp lệ.`);
  const date = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${field} không hợp lệ.`);
  }
  return date;
}

function canReviewLeave(role: string, rank: string) {
  return role === "SUPERVISOR" || role === "HIGH_COMMAND" || hasPersonnelManagement(role, rank);
}

// ───────── Xin nghỉ phép ─────────
export async function createLeaveRequest(fd: FormData) {
  const officer = await requireOfficer();
  const startDate = parseCalendarDate(s(fd, "startDate"), "Ngày bắt đầu");
  const endDate = parseCalendarDate(s(fd, "endDate"), "Ngày kết thúc");
  const reason = s(fd, "reason");
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (endDate < startDate) throw new Error("Ngày kết thúc phải sau ngày bắt đầu.");
  if (startDate < today) throw new Error("Đơn nghỉ phép phải được gửi trước hoặc trong ngày nghỉ.");
  if (endDate.getTime() - startDate.getTime() > 31 * 24 * 60 * 60 * 1000) throw new Error("Mỗi đơn nghỉ tối đa 32 ngày.");
  if (reason.length < 5 || reason.length > 1000) throw new Error("Lý do phải từ 5 đến 1.000 ký tự.");

  await auditedMutation(officer.id, "CREATE", "LeaveRequest", async (tx) => {
    const overlap = await tx.leaveRequest.findFirst({
      where: {
        officerId: officer.id,
        status: { in: ["PENDING", "APPROVED"] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      select: { id: true },
    });
    if (overlap) throw new Error("Bạn đã có đơn chờ duyệt hoặc nghỉ phép được duyệt trùng khoảng ngày này.");
    const leave = await tx.leaveRequest.create({
      data: { officerId: officer.id, startDate, endDate, reason },
    });
    return { result: leave, entityId: leave.id, summary: `Gửi đơn xin nghỉ từ ${s(fd, "startDate")} đến ${s(fd, "endDate")}.` };
  });
  revalidatePath("/mdt/leave");
  revalidatePath("/mdt/audit");
}

export async function reviewLeaveRequest(fd: FormData) {
  const reviewer = await requireOfficer();
  if (!canReviewLeave(reviewer.role, reviewer.rank)) throw new Error("Chỉ chỉ huy được duyệt đơn nghỉ phép.");
  const id = s(fd, "id");
  const status = s(fd, "status");
  const reviewNote = s(fd, "reviewNote").slice(0, 1000);
  if (!id || !["APPROVED", "REJECTED"].includes(status)) throw new Error("Thao tác duyệt đơn không hợp lệ.");

  await db.$transaction(async (tx) => {
    const leave = await tx.leaveRequest.findUnique({ where: { id }, select: { id: true, officerId: true, status: true } });
    if (!leave) throw new Error("Không tìm thấy đơn nghỉ phép.");
    if (leave.status !== "PENDING") throw new Error("Đơn này đã được xử lý.");
    await tx.leaveRequest.update({
      where: { id },
      data: {
        status: status as "APPROVED" | "REJECTED",
        reviewerId: reviewer.id,
        reviewedAt: new Date(),
        reviewNote: reviewNote || null,
      },
    });
    await recordAudit(tx, {
      actorId: reviewer.id,
      action: "UPDATE",
      entityType: "LeaveRequest",
      entityId: id,
      summary: `Duyệt đơn nghỉ phép ${status === "APPROVED" ? "chấp thuận" : "từ chối"}.`,
    });
  });
  revalidatePath("/mdt/leave");
  revalidatePath("/mdt/audit");
}

// ───────── Phạt giao thông và tạm giữ phương tiện ─────────
export async function createTrafficCitation(fd: FormData) {
  const officer = await requireOfficer();
  const citizenId = s(fd, "citizenId");
  const vehicleId = s(fd, "vehicleId");
  const reason = s(fd, "reason");
  const location = s(fd, "location").slice(0, 160);
  const amount = Number(s(fd, "amount"));
  if (!citizenId || reason.length < 5 || reason.length > 500) throw new Error("Chọn công dân và nhập lỗi vi phạm hợp lệ.");
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1_000_000_000) throw new Error("Số tiền phạt không hợp lệ.");

  await db.$transaction(async (tx) => {
    const [citizen, vehicle] = await Promise.all([
      tx.citizen.findUnique({ where: { id: citizenId }, select: { id: true, fullName: true } }),
      vehicleId ? tx.vehicle.findUnique({ where: { id: vehicleId }, select: { id: true, plate: true, ownerId: true } }) : null,
    ]);
    if (!citizen) throw new Error("Không tìm thấy hồ sơ công dân.");
    if (vehicleId && !vehicle) throw new Error("Không tìm thấy phương tiện.");
    if (vehicle?.ownerId && vehicle.ownerId !== citizenId) throw new Error("Phương tiện không thuộc công dân đã chọn.");
    const fine = await tx.fineRecord.create({
      data: { citizenId, reason: `Phạt giao thông: ${reason}`, amount },
      select: { id: true },
    });
    const citation = await tx.trafficCitation.create({
      data: { fineRecordId: fine.id, citizenId, vehicleId: vehicle?.id ?? null, officerId: officer.id, location: location || null },
      select: { id: true, citationNo: true },
    });
    await recordAudit(tx, {
      actorId: officer.id,
      action: "CREATE",
      entityType: "TrafficCitation",
      entityId: citation.id,
      summary: `Lập biên bản phạt giao thông #${citation.citationNo} cho ${citizen.fullName}, $${amount.toLocaleString("en-US")}.`,
    });
  });
  revalidatePath("/mdt/traffic");
  revalidatePath("/mdt/database");
  revalidatePath("/mdt/audit");
}

export async function createImpoundRecord(fd: FormData) {
  const officer = await requireOfficer();
  const plate = s(fd, "plate").toUpperCase().replace(/[\s-]/g, "");
  const vehicleId = s(fd, "vehicleId");
  const reason = s(fd, "reason");
  const retrievalFee = Number(s(fd, "retrievalFee"));
  if ((!plate && !vehicleId) || plate.length > 20 || reason.length < 5 || reason.length > 1000) throw new Error("Chọn xe hoặc nhập biển số, đồng thời ghi lý do tạm giữ hợp lệ.");
  if (!Number.isSafeInteger(retrievalFee) || retrievalFee < 0 || retrievalFee > 1_000_000_000) throw new Error("Phí lấy xe không hợp lệ.");

  await auditedMutation(officer.id, "CREATE", "ImpoundRecord", async (tx) => {
    const vehicle = vehicleId
      ? await tx.vehicle.findUnique({ where: { id: vehicleId }, select: { id: true, plate: true } })
      : await tx.vehicle.findUnique({ where: { plate }, select: { id: true, plate: true } });
    if (vehicleId && !vehicle) throw new Error("Không tìm thấy xe đăng ký.");
    const impoundPlate = vehicle?.plate ?? plate;
    const activeRecord = await tx.impoundRecord.findFirst({
      where: { plate: impoundPlate, status: "IMPOUNDED" },
      select: { id: true },
    });
    if (activeRecord) throw new Error("Phương tiện này đang có hồ sơ tạm giữ chưa giải quyết.");
    const record = await tx.impoundRecord.create({
      data: { plate: impoundPlate, vehicleId: vehicle?.id ?? null, reason, retrievalFee, officerId: officer.id },
    });
    return { result: record, entityId: record.id, summary: `Tạm giữ phương tiện ${record.plate}; phí lấy xe $${retrievalFee.toLocaleString("en-US")}.` };
  });
  revalidatePath("/mdt/traffic");
}

export async function releaseImpoundRecord(fd: FormData) {
  const officer = await requireOfficer();
  const id = s(fd, "id");
  const releaseNote = s(fd, "releaseNote").slice(0, 500);
  await db.$transaction(async (tx) => {
    const current = await tx.impoundRecord.findUnique({ where: { id }, select: { plate: true, status: true, retrievalFee: true } });
    if (!current) throw new Error("Không tìm thấy hồ sơ tạm giữ.");
    if (current.status !== "IMPOUNDED") throw new Error("Phương tiện này đã được giải quyết.");
    const released = await tx.impoundRecord.updateMany({
      where: { id, status: "IMPOUNDED" },
      data: { status: "RELEASED", releasedAt: new Date(), releasedById: officer.id, releaseNote: releaseNote || null },
    });
    if (!released.count) throw new Error("Phương tiện vừa được giải quyết bởi người khác.");
    if (current.retrievalFee > 0) {
      const payment = await tx.fundTransaction.create({
        data: {
          type: "INCOME",
          category: "IMPOUND_FEE",
          amount: current.retrievalFee,
          description: `Phí lấy phương tiện ${current.plate}`,
          impoundRecordId: id,
          createdById: officer.id,
        },
        select: { id: true },
      });
      await recordAudit(tx, {
        actorId: officer.id,
        action: "CREATE",
        entityType: "FundTransaction",
        entityId: payment.id,
        summary: `Thu phí lấy xe ${current.plate}: $${current.retrievalFee.toLocaleString("en-US")}.`,
      });
    }
    await recordAudit(tx, {
      actorId: officer.id,
      action: "UPDATE",
      entityType: "ImpoundRecord",
      entityId: id,
      summary: `Giải phóng phương tiện ${current.plate}.`,
    });
  });
  revalidatePath("/mdt/traffic");
  revalidatePath("/mdt/departments");
  revalidatePath("/mdt/audit");
}

export async function issueOfficerCertificate(fd: FormData) {
  const issuer = await requireOfficer();
  if (!hasFtoAccess(issuer.role, issuer.rank)) throw new Error("Chỉ FTO hoặc Ban Chỉ huy được cấp chứng chỉ.");
  const officerId = s(fd, "officerId");
  const title = s(fd, "title");
  const description = s(fd, "description").slice(0, 1000);
  if (!officerId || title.length < 3 || title.length > 120) throw new Error("Chọn sĩ quan và tên chứng chỉ hợp lệ.");
  const expiresOn = s(fd, "expiresOn");
  const expiresAt = expiresOn ? parseCalendarDate(expiresOn, "Ngày hết hạn") : null;
  if (expiresAt && expiresAt <= new Date()) throw new Error("Ngày hết hạn phải ở tương lai.");
  await db.$transaction(async (tx) => {
    const recipient = await tx.officer.findUnique({ where: { id: officerId }, select: { id: true, fullName: true, active: true } });
    if (!recipient?.active) throw new Error("Không tìm thấy sĩ quan đang hoạt động.");
    const certificate = await tx.officerCertificate.create({
      data: { officerId, issuerId: issuer.id, title, description: description || null, expiresAt },
      select: { id: true, certificateNo: true },
    });
    await recordAudit(tx, {
      actorId: issuer.id,
      action: "CREATE",
      entityType: "OfficerCertificate",
      entityId: certificate.id,
      summary: `Cấp chứng chỉ ${title} cho ${recipient.fullName} (#${certificate.certificateNo}).`,
    });
  });
  revalidatePath("/mdt/departments/fto/certificates");
  revalidatePath("/mdt/audit");
}

export async function updateOfficerCertificateStatus(fd: FormData) {
  const issuer = await requireOfficer();
  if (!hasFtoAccess(issuer.role, issuer.rank)) throw new Error("Chỉ FTO hoặc Ban Chỉ huy được cập nhật chứng chỉ.");
  const id = s(fd, "id");
  const status = s(fd, "status");
  if (!["ACTIVE", "SUSPENDED", "REVOKED"].includes(status)) throw new Error("Trạng thái chứng chỉ không hợp lệ.");
  await db.$transaction(async (tx) => {
    const certificate = await tx.officerCertificate.findUnique({ where: { id }, select: { title: true, certificateNo: true } });
    if (!certificate) throw new Error("Không tìm thấy chứng chỉ.");
    await tx.officerCertificate.update({ where: { id }, data: { status: status as "ACTIVE" | "SUSPENDED" | "REVOKED" } });
    await recordAudit(tx, {
      actorId: issuer.id,
      action: "UPDATE",
      entityType: "OfficerCertificate",
      entityId: id,
      summary: `Cập nhật chứng chỉ #${certificate.certificateNo} (${certificate.title}): ${status}.`,
    });
  });
  revalidatePath("/mdt/departments/fto/certificates");
  revalidatePath("/mdt/audit");
}

// ───────── Bảo mật tài khoản ─────────
export async function deleteOfficerAccount(fd: FormData) {
  const actor = await requirePersonnelManager();
  const id = s(fd, "id");
  if (!id) throw new Error("Thiếu mã nhân viên.");
  if (id === actor.id) throw new Error("Không thể xóa tài khoản đang đăng nhập.");

  await db.$transaction(async (tx) => {
    const target = await tx.officer.findUnique({
      where: { id },
      select: { id: true, fullName: true, badge: true, role: true, onDuty: true, active: true },
    });
    if (!target) throw new Error("Không tìm thấy hồ sơ nhân viên.");
    if (target.onDuty) throw new Error("Không thể xóa tài khoản đang trực. Kết thúc ca trực trước khi xóa.");
    if (target.role === "HIGH_COMMAND" && actor.role !== "HIGH_COMMAND") {
      throw new Error("Chỉ High Command mới được xóa tài khoản cấp cao.");
    }
    if (!target.active) throw new Error("Tài khoản nhân viên này đã bị vô hiệu hóa.");

    const deactivated = await tx.officer.updateMany({
      where: { id, active: true, onDuty: false },
      data: {
        active: false,
        onDuty: false,
        passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 12),
        sessionVersion: { increment: 1 },
        failedLoginAttempts: 0,
        loginLockedUntil: null,
      },
    });
    if (!deactivated.count) throw new Error("Tài khoản vừa được thay đổi. Tải lại trang rồi thử lại.");

    await tx.dutyLog.updateMany({
      where: { officerId: id, clockOut: null },
      data: { clockOut: new Date() },
    });

    await recordAudit(tx, {
      actorId: actor.id,
      action: "DELETE",
      entityType: "OfficerAccount",
      entityId: id,
      summary: `Xóa tài khoản nhân sự ${target.fullName} (#${target.badge}).`,
    });
  });

  revalidatePath("/mdt/hr");
  revalidatePath("/mdt");
  revalidatePath("/mdt/personnel");
}

export async function changePassword(fd: FormData) {
  const officer = await requireOfficer();
  const currentPassword = String(fd.get("currentPassword") ?? "");
  const newPassword = String(fd.get("newPassword") ?? "");
  const confirmation = String(fd.get("confirmation") ?? "");
  if (!await bcrypt.compare(currentPassword, officer.passwordHash)) throw new Error("Mật khẩu hiện tại không đúng.");
  if (newPassword.length < 12 || newPassword.length > 128 || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
    throw new Error("Mật khẩu mới cần tối thiểu 12 ký tự, gồm chữ hoa, chữ thường và số.");
  }
  if (newPassword !== confirmation) throw new Error("Xác nhận mật khẩu mới không khớp.");
  if (await bcrypt.compare(newPassword, officer.passwordHash)) throw new Error("Mật khẩu mới phải khác mật khẩu hiện tại.");
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.$transaction(async (tx) => {
    await tx.officer.update({
      where: { id: officer.id },
      data: { passwordHash, sessionVersion: { increment: 1 }, failedLoginAttempts: 0, loginLockedUntil: null },
    });
    await recordAudit(tx, {
      actorId: officer.id,
      action: "UPDATE",
      entityType: "OfficerSecurity",
      entityId: officer.id,
      summary: "Đổi mật khẩu; thu hồi toàn bộ phiên đăng nhập đang hoạt động.",
    });
  });
  destroySession();
  redirect("/login");
}

export async function revokeAllSessions() {
  const officer = await requireOfficer();
  await db.$transaction(async (tx) => {
    await tx.officer.update({ where: { id: officer.id }, data: { sessionVersion: { increment: 1 } } });
    await recordAudit(tx, {
      actorId: officer.id,
      action: "UPDATE",
      entityType: "OfficerSecurity",
      entityId: officer.id,
      summary: "Thu hồi toàn bộ phiên đăng nhập đang hoạt động.",
    });
  });
  destroySession();
  redirect("/login");
}

// ───────── Nội vụ (Ban Chỉ huy) ─────────
export async function createInternalAffairsCase(fd: FormData) {
  const officer = await requirePersonnelManager();
  const subjectId = s(fd, "subjectId");
  const category = s(fd, "category");
  const summary = s(fd, "summary");
  const details = s(fd, "details");
  if (!subjectId || !category || category.length > 80) throw new Error("Chọn sĩ quan và loại vụ việc hợp lệ.");
  if (summary.length < 5 || summary.length > 180) throw new Error("Tóm tắt phải từ 5 đến 180 ký tự.");
  if (details.length < 20 || details.length > 5000) throw new Error("Nội dung phải từ 20 đến 5.000 ký tự.");
  const subject = await db.officer.findUnique({ where: { id: subjectId }, select: { id: true, fullName: true, badge: true } });
  if (!subject) throw new Error("Không tìm thấy sĩ quan được ghi nhận.");

  await db.$transaction(async (tx) => {
    const record = await tx.internalAffairsCase.create({
      data: { subjectId, authorId: officer.id, category, summary, details },
      select: { id: true, caseNumber: true },
    });
    await recordAudit(tx, {
      actorId: officer.id,
      action: "CREATE",
      entityType: "InternalAffairsCase",
      entityId: record.id,
      summary: `Tạo hồ sơ IA #${record.caseNumber} cho ${subject.fullName} (#${subject.badge}).`,
    });
    return record;
  });
  revalidatePath("/mdt/internal-affairs");
  revalidatePath("/mdt/audit");
}

export async function updateInternalAffairsCase(fd: FormData) {
  const officer = await requirePersonnelManager();
  const id = s(fd, "id");
  const status = s(fd, "status");
  const resolution = s(fd, "resolution");
  if (!id || !["OPEN", "INVESTIGATING", "CLOSED"].includes(status)) {
    throw new Error("Trạng thái hồ sơ IA không hợp lệ.");
  }
  if (resolution.length > 3000) throw new Error("Kết luận tối đa 3.000 ký tự.");

  await db.$transaction(async (tx) => {
    const current = await tx.internalAffairsCase.findUnique({
      where: { id },
      select: { id: true, caseNumber: true, status: true },
    });
    if (!current) throw new Error("Không tìm thấy hồ sơ IA.");
    await tx.internalAffairsCase.update({
      where: { id },
      data: { status: status as "OPEN" | "INVESTIGATING" | "CLOSED", resolution: resolution || null },
    });
    await recordAudit(tx, {
      actorId: officer.id,
      action: "UPDATE",
      entityType: "InternalAffairsCase",
      entityId: id,
      summary: `Cập nhật hồ sơ IA #${current.caseNumber}: ${current.status} → ${status}.`,
    });
  });
  revalidatePath("/mdt/internal-affairs");
  revalidatePath("/mdt/audit");
}

// ───────── Ca trực ─────────
export async function toggleDuty(fd: FormData) {
  const o = await requireOfficer();
  await db.$transaction(async (tx) => {
    if (o.onDuty) {
      await tx.dutyLog.updateMany({ where: { officerId: o.id, clockOut: null }, data: { clockOut: new Date() } });
      await tx.officer.update({ where: { id: o.id }, data: { onDuty: false } });
    } else {
      const callsign = s(fd, "callsign").slice(0, 20) || o.callsign || `${o.badge}`;
      const log = await tx.dutyLog.create({ data: { officerId: o.id, callsign } });
      await tx.officer.update({ where: { id: o.id }, data: { onDuty: true, callsign } });
      await recordAudit(tx, {
        actorId: o.id,
        action: "CREATE",
        entityType: "DutyLog",
        entityId: log.id,
        summary: `Bắt đầu ca trực${callsign ? ` với call sign ${callsign}` : ""}.`,
      });
      return;
    }
    await recordAudit(tx, {
      actorId: o.id,
      action: "UPDATE",
      entityType: "DutyLog",
      entityId: o.id,
      summary: "Kết thúc ca trực.",
    });
  });
  revalidatePath("/mdt", "layout");
}

export async function postAnnouncement(fd: FormData) {
  const o = await requireRole("SUPERVISOR");
  const title = s(fd, "title");
  const body = s(fd, "body");
  if (!title || !body) return;
  await auditedMutation(o.id, "CREATE", "Announcement", async (tx) => {
    const announcement = await tx.announcement.create({ data: { title, body, pinned: fd.get("pinned") === "on", authorId: o.id } });
    return { result: announcement, entityId: announcement.id, summary: "Tạo thông báo nội bộ." };
  });
  revalidatePath("/mdt");
}

export async function deleteAnnouncement(fd: FormData) {
  const o = await requireRole("SUPERVISOR");
  const id = s(fd, "id");
  await auditedMutation(o.id, "DELETE", "Announcement", async (tx) => {
    const announcement = await tx.announcement.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!announcement) throw new Error("Không tìm thấy thông báo.");
    await tx.announcement.delete({ where: { id } });
    return { result: undefined, entityId: id, summary: `Xóa thông báo nội bộ: ${announcement.title.slice(0, 100)}.` };
  });
  revalidatePath("/mdt");
}

// ───────── CSDL ─────────
export async function createCitizen(fd: FormData) {
  const officer = await requireOfficer();
  const fullName = s(fd, "fullName");
  const citizenId = s(fd, "citizenId").toUpperCase();
  if (!fullName || !citizenId) return;
  const c = await auditedMutation(officer.id, "CREATE", "Citizen", async (tx) => {
    const citizen = await tx.citizen.create({ data: {
      fullName,
      citizenId,
      phone: s(fd, "phone") || null,
      dob: s(fd, "dob") || null,
      photoUrl: s(fd, "photoUrl") || null,
      tags: s(fd, "tags").split(",").map((t) => t.trim()).filter(Boolean),
      notes: s(fd, "notes") || null,
    } });
    return { result: citizen, entityId: citizen.id, summary: "Tạo hồ sơ công dân." };
  });
  redirect(`/mdt/database/citizens/${c.id}`);
}

export async function updateCitizen(fd: FormData) {
  const officer = await requireOfficer();
  const id = s(fd, "id");
  await auditedMutation(officer.id, "UPDATE", "Citizen", async (tx) => {
    await tx.citizen.update({ where: { id }, data: {
      phone: s(fd, "phone") || null,
      photoUrl: s(fd, "photoUrl") || null,
      tags: s(fd, "tags").split(",").map((t) => t.trim()).filter(Boolean),
      notes: s(fd, "notes") || null,
    } });
    return { result: undefined, entityId: id, summary: "Cập nhật hồ sơ công dân." };
  });
  revalidatePath(`/mdt/database/citizens/${id}`);
}

export async function createVehicle(fd: FormData) {
  const officer = await requireOfficer();
  const plate = s(fd, "plate").toUpperCase().replace(/[\s-]/g, "");
  if (!plate) return;
  await auditedMutation(officer.id, "CREATE", "Vehicle", async (tx) => {
    const created = await tx.vehicle.create({ data: {
      plate,
      model: s(fd, "model") || "Không rõ",
      color: s(fd, "color") || "Không rõ",
      ownerId: s(fd, "ownerId") || null,
      stolen: fd.get("stolen") === "on",
    } });
    return { result: created, entityId: created.id, summary: "Tạo hồ sơ phương tiện." };
  });
  revalidatePath("/mdt/database");
  const owner = s(fd, "ownerId");
  if (owner) revalidatePath(`/mdt/database/citizens/${owner}`);
}

export async function createEvidence(fd: FormData) {
  const o = await requireOfficer();
  const locker = s(fd, "locker");
  const items = s(fd, "items");
  if (!locker || !items) return;
  await auditedMutation(o.id, "CREATE", "Evidence", async (tx) => {
    const evidence = await tx.evidence.create({ data: {
      locker,
      items,
      mediaUrl: s(fd, "mediaUrl") || null,
      citizenId: s(fd, "citizenId") || null,
      officerId: o.id,
    } });
    return { result: evidence, entityId: evidence.id, summary: "Tạo bản ghi kho bằng chứng." };
  });
  revalidatePath("/mdt/database");
  const cid = s(fd, "citizenId");
  if (cid) revalidatePath(`/mdt/database/citizens/${cid}`);
}

export async function markFinePaid(fd: FormData) {
  const officer = await requireOfficer();
  const id = s(fd, "id");
  const fine = await db.$transaction(async (tx) => {
    const record = await tx.fineRecord.findUnique({
      where: { id },
      select: { id: true, citizenId: true, amount: true, reason: true, paid: true },
    });
    if (!record) throw new Error("Không tìm thấy biên bản phạt.");
    if (!record.paid) {
      const updated = await tx.fineRecord.updateMany({
        where: { id: record.id, paid: false },
        data: { paid: true },
      });
      if (updated.count) {
        await tx.fundTransaction.create({
          data: {
            type: "INCOME",
            category: "FINE_COLLECTION",
            amount: record.amount,
            description: record.reason,
            fineRecordId: record.id,
            createdById: officer.id,
          },
        });
        await recordAudit(tx, {
          actorId: officer.id,
          action: "UPDATE",
          entityType: "FineRecord",
          entityId: record.id,
          summary: "Đánh dấu biên bản đã nộp; ghi nhận khoản thu vào sổ quỹ.",
        });
      }
    }
    return record;
  }, { isolationLevel: "Serializable" });
  revalidatePath(`/mdt/database/citizens/${fine.citizenId}`);
  revalidatePath("/mdt/departments");
}

// ───────── Báo cáo ─────────
const incidentSchema = z.object({
  title: z.string().trim().min(3, "Nhập tiêu đề").max(150),
  location: z.string().trim().max(150).optional(),
  narrative: z.string().trim().min(10, "Tường trình quá ngắn").max(8000),
  suspectId: z.string().optional().nullable(),
  suspectName: z.string().trim().max(100).optional(),
  charges: z.array(z.object({ id: z.string(), count: z.number().int().min(1).max(20) })).max(40),
});

export type IncidentInput = z.infer<typeof incidentSchema>;

/** Tổng tiền phạt / án tù luôn được tính lại ở server từ bảng Charge – không tin số liệu từ client. */
export async function createIncident(input: IncidentInput): Promise<{ ok: true; number: number; id: string } | { ok: false; error: string }> {
  const o = await requireOfficer();
  const parsed = incidentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  const chargeRows = await db.charge.findMany({ where: { id: { in: d.charges.map((c) => c.id) } } });
  let totalFine = 0;
  let totalJail = 0;
  const lines = d.charges.flatMap((c) => {
    const row = chargeRows.find((r) => r.id === c.id);
    if (!row) return [];
    totalFine += row.fine * c.count;
    totalJail += row.jailMinutes * c.count;
    return [{ chargeId: row.id, count: c.count }];
  });

  const incident = await db.$transaction(async (tx) => {
    const created = await tx.incident.create({ data: {
      title: d.title,
      location: d.location || null,
      narrative: d.narrative,
      suspectId: d.suspectId || null,
      suspectName: d.suspectName || null,
      authorId: o.id,
      totalFine,
      totalJail,
      charges: { create: lines },
    } });

    if (d.suspectId && totalFine > 0) {
      await tx.fineRecord.create({
        data: { citizenId: d.suspectId, incidentId: created.id, reason: `Báo cáo #${created.number}: ${d.title}`, amount: totalFine },
      });
    }
    await recordAudit(tx, {
      actorId: o.id,
      action: "CREATE",
      entityType: "Incident",
      entityId: created.id,
      summary: `Tạo báo cáo vụ việc #${created.number}.`,
    });
    return created;
  });
  revalidatePath("/mdt/reports");
  return { ok: true, number: incident.number, id: incident.id };
}

// ───────── Tác chiến ─────────
export async function createBolo(fd: FormData) {
  const o = await requireOfficer();
  const description = s(fd, "description");
  if (!description) return;
  await auditedMutation(o.id, "CREATE", "Bolo", async (tx) => {
    const bolo = await tx.bolo.create({ data: {
      kind: s(fd, "kind") || "Đối tượng",
      description,
      plate: s(fd, "plate").toUpperCase() || null,
      lastSeen: s(fd, "lastSeen") || null,
      authorId: o.id,
    } });
    return { result: bolo, entityId: bolo.id, summary: "Tạo thông báo BOLO." };
  });
  revalidatePath("/mdt/ops");
  revalidatePath("/mdt");
}

export async function closeBolo(fd: FormData) {
  const o = await requireOfficer();
  const id = s(fd, "id");
  await auditedMutation(o.id, "UPDATE", "Bolo", async (tx) => {
    await tx.bolo.update({ where: { id }, data: { active: false } });
    return { result: undefined, entityId: id, summary: "Đóng thông báo BOLO." };
  });
  revalidatePath("/mdt/ops");
  revalidatePath("/mdt");
}

export async function createWarrant(fd: FormData) {
  const o = await requireRole("SUPERVISOR");
  const targetName = s(fd, "targetName");
  const reason = s(fd, "reason");
  if (!targetName || !reason) return;
  await auditedMutation(o.id, "CREATE", "Warrant", async (tx) => {
    const warrant = await tx.warrant.create({ data: {
      targetName,
      reason,
      citizenId: s(fd, "citizenId") || null,
      danger: (s(fd, "danger") as "LOW" | "MEDIUM" | "HIGH" | "EXTREME") || "MEDIUM",
      bounty: Math.max(0, Number(s(fd, "bounty")) || 0),
      isPublic: fd.get("isPublic") === "on",
      authorId: o.id,
    } });
    return { result: warrant, entityId: warrant.id, summary: "Tạo lệnh truy nã." };
  });
  revalidatePath("/mdt/ops");
}

export async function setWarrantStatus(fd: FormData) {
  const o = await requireRole("SUPERVISOR");
  const status = s(fd, "status") as "ACTIVE" | "SERVED" | "CANCELLED";
  const id = s(fd, "id");
  if (!["ACTIVE", "SERVED", "CANCELLED"].includes(status)) throw new Error("Trạng thái lệnh truy nã không hợp lệ.");
  await auditedMutation(o.id, "UPDATE", "Warrant", async (tx) => {
    const warrant = await tx.warrant.findUnique({ where: { id }, select: { targetName: true } });
    if (!warrant) throw new Error("Không tìm thấy lệnh truy nã.");
    await tx.warrant.update({ where: { id }, data: { status } });
    return { result: undefined, entityId: id, summary: `Cập nhật trạng thái lệnh truy nã của ${warrant.targetName}: ${status}.` };
  });
  revalidatePath("/mdt/ops");
}

export async function deleteWarrant(fd: FormData) {
  const o = await requireRole("HIGH_COMMAND");
  const id = s(fd, "id");
  await auditedMutation(o.id, "DELETE", "Warrant", async (tx) => {
    const warrant = await tx.warrant.findUnique({ where: { id }, select: { targetName: true } });
    if (!warrant) throw new Error("Không tìm thấy lệnh truy nã.");
    await tx.warrant.delete({ where: { id } });
    return { result: undefined, entityId: id, summary: `Xóa lệnh truy nã của ${warrant.targetName}.` };
  });
  revalidatePath("/mdt/ops");
}

// ───────── Dispatch ─────────
const CALL_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const CALL_STATUSES = ["PENDING", "DISPATCHED", "ON_SCENE", "CLEARED", "CANCELLED"] as const;
const CALL_CATEGORIES = [
  "Traffic Stop",
  "Traffic Collision",
  "Medical Assistance",
  "Disturbance",
  "Robbery",
  "Weapons Call",
  "Officer Needs Assistance",
  "Other",
] as const;

export async function createDispatchCall(fd: FormData) {
  const officer = await requireOfficer();
  const title = s(fd, "title");
  const location = s(fd, "location");
  const details = s(fd, "details");
  const category = s(fd, "category");
  const priority = s(fd, "priority");

  if (!title || title.length > 120) throw new Error("Tiêu đề cuộc gọi phải có từ 1 đến 120 ký tự.");
  if (!location || location.length > 160) throw new Error("Địa điểm cuộc gọi là bắt buộc và tối đa 160 ký tự.");
  if (!details || details.length > 4000) throw new Error("Chi tiết cuộc gọi là bắt buộc và tối đa 4000 ký tự.");
  if (!CALL_CATEGORIES.some((item) => item === category)) throw new Error("Loại cuộc gọi không hợp lệ.");
  if (!CALL_PRIORITIES.some((item) => item === priority)) throw new Error("Mức ưu tiên không hợp lệ.");

  await auditedMutation(officer.id, "CREATE", "DispatchCall", async (tx) => {
    const call = await tx.dispatchCall.create({ data: {
      title,
      location,
      details,
      category,
      priority: priority as (typeof CALL_PRIORITIES)[number],
      callerName: s(fd, "callerName").slice(0, 100) || null,
      callerPhone: s(fd, "callerPhone").slice(0, 40) || null,
      reporterId: officer.id,
    } });
    return { result: call, entityId: call.id, summary: `Tạo cuộc gọi điều phối: ${title.slice(0, 100)}.` };
  });
  revalidatePath("/mdt/dispatch");
  revalidatePath("/mdt");
}

export async function assignDispatchUnits(fd: FormData) {
  const officer = await requireRole("SUPERVISOR");
  const callId = s(fd, "callId");
  if (!callId) throw new Error("Thiếu mã cuộc gọi.");

  const officerIds = [...new Set(fd.getAll("officerIds").map(String).filter(Boolean))];
  const eligible = officerIds.length
    ? await db.officer.findMany({
        where: { id: { in: officerIds }, active: true, onDuty: true },
        select: { id: true },
      })
    : [];
  if (eligible.length !== officerIds.length) {
    throw new Error("Chỉ có thể điều phối sĩ quan đang On-Duty và tài khoản đang Active.");
  }

  await db.$transaction(async (tx) => {
    const call = await tx.dispatchCall.findUnique({ where: { id: callId }, select: { id: true, status: true } });
    if (!call) throw new Error("Không tìm thấy cuộc gọi.");
    if (call.status === "CLEARED" || call.status === "CANCELLED") {
      throw new Error("Không thể điều phối lại cuộc gọi đã đóng.");
    }

    await tx.callAssignment.deleteMany({ where: { callId } });
    if (officerIds.length) {
      await tx.callAssignment.createMany({
        data: officerIds.map((officerId) => ({ callId, officerId })),
      });
    }
    if (officerIds.length && call.status === "PENDING") {
      await tx.dispatchCall.update({ where: { id: callId }, data: { status: "DISPATCHED" } });
    }
    await recordAudit(tx, {
      actorId: officer.id,
      action: "UPDATE",
      entityType: "DispatchCall",
      entityId: callId,
      summary: `Cập nhật điều phối cuộc gọi; số sĩ quan được phân công: ${officerIds.length}.`,
    });
  });

  revalidatePath("/mdt/dispatch");
  revalidatePath("/mdt");
}

export async function updateDispatchCallStatus(fd: FormData) {
  const officer = await requireRole("SUPERVISOR");
  const id = s(fd, "callId");
  const status = s(fd, "status");
  if (!id || !CALL_STATUSES.some((item) => item === status)) {
    throw new Error("Trạng thái hoặc mã cuộc gọi không hợp lệ.");
  }

  await db.$transaction(async (tx) => {
    const call = await tx.dispatchCall.findUnique({ where: { id }, select: { status: true } });
    if (!call) throw new Error("Không tìm thấy cuộc gọi.");
    if (call.status === "CLEARED" || call.status === "CANCELLED") {
      throw new Error("Cuộc gọi đã đóng, không thể thay đổi trạng thái.");
    }
    await tx.dispatchCall.update({
      where: { id },
      data: { status: status as (typeof CALL_STATUSES)[number] },
    });
    await recordAudit(tx, {
      actorId: officer.id,
      action: "UPDATE",
      entityType: "DispatchCall",
      entityId: id,
      summary: `Cập nhật trạng thái cuộc gọi: ${call.status} → ${status}.`,
    });
  });
  revalidatePath("/mdt/dispatch");
  revalidatePath("/mdt");
}

// ───────── Nội bộ (High Command) ─────────
export async function createOfficer(fd: FormData) {
  const actor = await requirePersonnelManager();
  const username = s(fd, "username").toLowerCase();
  const password = s(fd, "password");
  if (!username || password.length < 6) return;
  await auditedMutation(actor.id, "CREATE", "Officer", async (tx) => {
    const created = await tx.officer.create({ data: {
      username,
      passwordHash: await bcrypt.hash(password, 10),
      fullName: s(fd, "fullName"),
      badge: s(fd, "badge"),
      rank: s(fd, "rank") || "Cadet",
      role: "OFFICER",
    } });
    return { result: created, entityId: created.id, summary: `Tạo tài khoản nhân sự cho ${created.fullName} (#${created.badge}).` };
  });
  revalidatePath("/mdt/hr");
}

export async function updateOfficer(fd: FormData) {
  const me = await requirePersonnelManager();
  const id = s(fd, "id");
  const role = s(fd, "role") as "OFFICER" | "SUPERVISOR" | "ACCOUNTING" | "FTO" | "HIGH_COMMAND";
  const salaryPerHour = Number(s(fd, "salaryPerHour"));
  if (!Number.isSafeInteger(salaryPerHour) || salaryPerHour < 0) {
    throw new Error("Mức lương theo giờ phải là số nguyên từ 0 trở lên.");
  }
  // Không cho tự hạ quyền / tự khóa chính mình để tránh mất toàn bộ quyền quản trị.
  const self = id === me.id;
  await auditedMutation(me.id, "UPDATE", "Officer", async (tx) => {
    const target = await tx.officer.findUnique({ where: { id }, select: { fullName: true, badge: true } });
    if (!target) throw new Error("Không tìm thấy hồ sơ sĩ quan.");
    await tx.officer.update({ where: { id }, data: {
      rank: s(fd, "rank"),
      badge: s(fd, "badge"),
      salaryPerHour,
      role: self ? me.role : role,
      active: self ? true : fd.get("active") === "on",
    } });
    return { result: undefined, entityId: id, summary: `Cập nhật hồ sơ/quyền nhân sự ${target.fullName} (#${target.badge}).` };
  });
  revalidatePath("/mdt/hr");
  revalidatePath("/mdt");
  revalidatePath("/mdt/departments");
}

export async function recordPayrollPayment(fd: FormData) {
  const officer = await requireOfficer();
  if (!hasFinanceAccess(officer.role, officer.rank)) throw new Error("Không đủ quyền hạn.");

  const payrollOfficerId = s(fd, "officerId");
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const payrollPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const expenseRecorded = await db.$transaction(async (tx) => {
    const existing = await tx.fundTransaction.findFirst({
      where: { payrollOfficerId, payrollPeriod, category: "PAYROLL" },
      select: { id: true },
    });
    if (existing) return false;

    const recipient = await tx.officer.findUnique({
      where: { id: payrollOfficerId },
      select: { id: true, fullName: true, active: true, salaryPerHour: true },
    });
    if (!recipient || !recipient.active) throw new Error("Không tìm thấy sĩ quan đang hoạt động.");

    const dutyLogs = await tx.dutyLog.findMany({
      where: {
        officerId: recipient.id,
        clockIn: { lt: now },
        OR: [{ clockOut: null }, { clockOut: { gt: monthStart } }],
      },
      select: { clockIn: true, clockOut: true },
    });
    const hours = dutyHoursInPeriod(dutyLogs, monthStart, now);
    const amount = Math.round(hours * recipient.salaryPerHour);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error("Chưa có khoản lương hợp lệ để ghi nhận chi trả.");
    }

    const [income, expense, untrackedPaidFines] = await Promise.all([
      tx.fundTransaction.aggregate({
        where: { type: "INCOME" },
        _sum: { amount: true },
      }),
      tx.fundTransaction.aggregate({
        where: { type: "EXPENSE" },
        _sum: { amount: true },
      }),
      tx.fineRecord.aggregate({
        where: { paid: true, fundTransaction: null },
        _sum: { amount: true },
      }),
    ]);
    const balance =
      (income._sum.amount ?? 0) +
      (untrackedPaidFines._sum.amount ?? 0) -
      (expense._sum.amount ?? 0);
    if (amount > balance) {
      throw new Error(`Quỹ không đủ số dư. Số dư hiện tại: $${balance.toLocaleString("en-US")}.`);
    }

    const payment = await tx.fundTransaction.create({
      data: {
        type: "EXPENSE",
        category: "PAYROLL",
        amount,
        description: `Chi lương kỳ ${payrollPeriod} · ${recipient.fullName}`,
        payrollOfficerId: recipient.id,
        payrollPeriod,
        createdById: officer.id,
      },
    });
    await recordAudit(tx, {
      actorId: officer.id,
      action: "CREATE",
      entityType: "FundTransaction",
      entityId: payment.id,
      summary: `Ghi nhận chi lương cho ${recipient.fullName}, kỳ ${payrollPeriod}, số tiền $${amount.toLocaleString("en-US")}.`,
    });
    return true;
  }, { isolationLevel: "Serializable" });

  if (!expenseRecorded) {
    throw new Error("Đã ghi nhận thanh toán lương cho sĩ quan này trong kỳ hiện tại.");
  }
  revalidatePath("/mdt/departments");
}

function getTrainingDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Chọn ngày huấn luyện hợp lệ.");
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error("Ngày huấn luyện không hợp lệ.");
  return date;
}

async function requireFtoOfficer() {
  const officer = await requireOfficer();
  if (!hasFtoAccess(officer.role, officer.rank)) throw new Error("Không đủ quyền truy cập nghiệp vụ FTO.");
  return officer;
}

async function requireAssignmentAccess(assignmentId: string, officerId: string) {
  const assignment = await db.ftoAssignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, trainerId: true, status: true, assignedAt: true },
  });
  if (!assignment) throw new Error("Không tìm thấy hồ sơ phân công FTO.");

  const officer = await db.officer.findUnique({
    where: { id: officerId },
    select: { role: true, rank: true },
  });
  if (!officer) throw new Error("Không tìm thấy tài khoản sĩ quan.");
  if (assignment.trainerId !== officerId && !hasPersonnelManagement(officer.role, officer.rank)) {
    throw new Error("Chỉ FTO phụ trách hoặc ban chỉ huy được cập nhật hồ sơ huấn luyện này.");
  }
  return assignment;
}

export async function createFtoAssignment(fd: FormData) {
  const officer = await requireFtoOfficer();
  const traineeId = s(fd, "traineeId");
  const trainerId = s(fd, "trainerId");
  const notes = s(fd, "notes").slice(0, 1000);
  if (!traineeId || !trainerId || traineeId === trainerId) {
    throw new Error("Chọn học viên và FTO phụ trách hợp lệ.");
  }

  await db.$transaction(async (tx) => {
    const [trainee, trainer] = await Promise.all([
      tx.officer.findUnique({
        where: { id: traineeId },
        select: { id: true, rank: true, role: true, active: true },
      }),
      tx.officer.findUnique({
        where: { id: trainerId },
        select: { id: true, role: true, active: true },
      }),
    ]);
    if (!trainee?.active || trainee.rank.trim().toLowerCase() !== "cadet" || trainee.role === "FTO") {
      throw new Error("Học viên phải là Cadet đang hoạt động.");
    }
    if (!trainer?.active || trainer.role !== "FTO") {
      throw new Error("FTO phụ trách phải có tài khoản đang hoạt động và quyền Phòng FTO.");
    }

    const existing = await tx.ftoAssignment.findFirst({
      where: { traineeId, status: "ACTIVE" },
      select: { id: true },
    });
    if (existing) throw new Error("Học viên này đã có một phân công FTO đang hoạt động.");

    const assignment = await tx.ftoAssignment.create({
      data: { traineeId, trainerId, assignedById: officer.id, notes: notes || null },
    });
    await recordAudit(tx, {
      actorId: officer.id,
      action: "CREATE",
      entityType: "FtoAssignment",
      entityId: assignment.id,
      summary: "Tạo phân công huấn luyện FTO.",
    });
  }, { isolationLevel: "Serializable" });

  revalidatePath("/mdt/departments/fto");
}

export async function createFtoTrainingLog(fd: FormData) {
  const officer = await requireFtoOfficer();
  const assignmentId = s(fd, "assignmentId");
  const topic = s(fd, "topic");
  const notes = s(fd, "notes");
  if (topic.length < 3 || topic.length > 120) throw new Error("Chủ đề huấn luyện phải từ 3 đến 120 ký tự.");
  if (notes.length < 10 || notes.length > 3000) throw new Error("Nhật ký huấn luyện phải từ 10 đến 3.000 ký tự.");

  const assignment = await requireAssignmentAccess(assignmentId, officer.id);
  if (assignment.status !== "ACTIVE") throw new Error("Chỉ có thể ghi nhật ký cho phân công đang huấn luyện.");
  const sessionDate = getTrainingDate(s(fd, "sessionDate"));
  if (sessionDate.getTime() > Date.now() + 60_000) throw new Error("Ngày huấn luyện không thể ở tương lai.");
  if (sessionDate < new Date(assignment.assignedAt.getFullYear(), assignment.assignedAt.getMonth(), assignment.assignedAt.getDate())) {
    throw new Error("Ngày huấn luyện không thể trước ngày phân công.");
  }

  await auditedMutation(officer.id, "CREATE", "FtoTrainingLog", async (tx) => {
    const log = await tx.ftoTrainingLog.create({ data: { assignmentId, authorId: officer.id, sessionDate, topic, notes } });
    return { result: log, entityId: log.id, summary: `Ghi nhật ký huấn luyện FTO: ${topic.slice(0, 100)}.` };
  });
  revalidatePath("/mdt/departments/fto");
}

export async function createFtoEvaluation(fd: FormData) {
  const officer = await requireFtoOfficer();
  const assignmentId = s(fd, "assignmentId");
  const scores = {
    radioScore: Number(s(fd, "radioScore")),
    procedureScore: Number(s(fd, "procedureScore")),
    safetyScore: Number(s(fd, "safetyScore")),
    judgmentScore: Number(s(fd, "judgmentScore")),
  };
  if (Object.values(scores).some((score) => !Number.isInteger(score) || score < 1 || score > 5)) {
    throw new Error("Điểm đánh giá phải là số nguyên từ 1 đến 5.");
  }
  const recommendation = s(fd, "recommendation");
  if (
    recommendation !== "READY_FOR_SOLO" &&
    recommendation !== "CONTINUE_TRAINING" &&
    recommendation !== "ADDITIONAL_COACHING"
  ) {
    throw new Error("Chọn kết luận đánh giá hợp lệ.");
  }
  const strengths = s(fd, "strengths");
  const improvementAreas = s(fd, "improvementAreas");
  if (strengths.length < 5 || strengths.length > 1500 || improvementAreas.length < 5 || improvementAreas.length > 1500) {
    throw new Error("Nhập nhận xét tích cực và nội dung cần cải thiện (5–1.500 ký tự mỗi mục).");
  }
  const assignment = await requireAssignmentAccess(assignmentId, officer.id);
  if (assignment.status !== "ACTIVE") throw new Error("Phân công này đã hoàn tất, không nhận đánh giá mới.");
  if (
    recommendation === "READY_FOR_SOLO" &&
    Object.values(scores).some((score) => score < 3)
  ) {
    throw new Error("Để kết luận đạt, mọi tiêu chí phải từ 3 điểm trở lên.");
  }

  await db.$transaction(async (tx) => {
    const current = await tx.ftoAssignment.findFirst({
      where: {
        id: assignmentId,
        status: "ACTIVE",
        trainingLogs: { some: {} },
      },
      select: { id: true, traineeId: true },
    });
    if (!current) throw new Error("Phân công đã hoàn tất, chưa có nhật ký huấn luyện hoặc đã được cập nhật bởi người khác.");
    const evaluation = await tx.ftoEvaluation.create({
      data: {
        assignmentId,
        authorId: officer.id,
        ...scores,
        recommendation,
        strengths,
        improvementAreas,
      },
    });
    if (recommendation === "READY_FOR_SOLO") {
      await tx.ftoAssignment.update({
        where: { id: assignmentId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      const certificate = await tx.officerCertificate.create({
        data: {
          officerId: current.traineeId,
          issuerId: officer.id,
          title: "FTO — Hoàn tất đào tạo cơ bản",
          description: `Cấp tự động theo đánh giá FTO ngày ${new Date().toLocaleDateString("vi-VN")}.`,
        },
        select: { id: true, certificateNo: true },
      });
      await recordAudit(tx, {
        actorId: officer.id,
        action: "CREATE",
        entityType: "OfficerCertificate",
        entityId: certificate.id,
        summary: `Cấp chứng chỉ hoàn tất đào tạo FTO #${certificate.certificateNo} sau khi học viên đạt chuẩn độc lập.`,
      });
    }
    await recordAudit(tx, {
      actorId: officer.id,
      action: "CREATE",
      entityType: "FtoEvaluation",
      entityId: evaluation.id,
      summary: `Ghi nhận đánh giá FTO với kết luận ${recommendation}.`,
    });
  }, { isolationLevel: "Serializable" });

  revalidatePath("/mdt/departments/fto");
  revalidatePath("/mdt/departments/fto/certificates");
  revalidatePath("/mdt/audit");
}

export async function reviewApplication(fd: FormData) {
  const officer = await requirePersonnelManager();
  const status = s(fd, "status") as "APPROVED" | "REJECTED";
  if (!["APPROVED", "REJECTED"].includes(status)) throw new Error("Trạng thái hồ sơ không hợp lệ.");
  const id = s(fd, "id");
  await auditedMutation(officer.id, "UPDATE", "Application", async (tx) => {
    const application = await tx.application.findUnique({ where: { id }, select: { fullName: true } });
    if (!application) throw new Error("Không tìm thấy hồ sơ ứng tuyển.");
    await tx.application.update({ where: { id }, data: { status, reviewNote: s(fd, "note") || null } });
    return { result: undefined, entityId: id, summary: `Cập nhật trạng thái hồ sơ ứng tuyển của ${application.fullName}: ${status}.` };
  });
  revalidatePath("/mdt/hr");
}

export async function updateReportStatus(fd: FormData) {
  const officer = await requireRole("SUPERVISOR");
  const status = s(fd, "status");
  if (!["PENDING", "REVIEWING", "CLOSED"].includes(status)) throw new Error("Trạng thái báo cáo không hợp lệ.");
  const id = s(fd, "id");
  await auditedMutation(officer.id, "UPDATE", "PublicReport", async (tx) => {
    await tx.publicReport.findUniqueOrThrow({ where: { id }, select: { id: true } });
    await tx.publicReport.update({
      where: { id },
      data: { status: status as "PENDING" | "REVIEWING" | "CLOSED" },
    });
    return { result: undefined, entityId: id, summary: `Cập nhật trạng thái báo cáo: ${status}.` };
  });
  revalidatePath("/mdt/hr");
}
