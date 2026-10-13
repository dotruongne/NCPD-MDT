import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);
  const chief = await db.officer.upsert({
    where: { username: "chief" },
    update: {},
    create: {
      username: "chief",
      passwordHash,
      fullName: "John Carter",
      rank: "Chief of Police",
      badge: "001",
      role: "HIGH_COMMAND",
      mustChangePassword: true,
    },
  });

  const charges = [
    ["TR-101", "Chạy quá tốc độ", "Giao thông", 500, 0],
    ["TR-102", "Vượt đèn đỏ", "Giao thông", 400, 0],
    ["TR-103", "Lái xe nguy hiểm", "Giao thông", 1200, 5],
    ["TR-104", "Không có bằng lái", "Giao thông", 800, 0],
    ["PC-201", "Gây rối trật tự công cộng", "Hình sự nhẹ", 1000, 5],
    ["PC-202", "Tàng trữ ma túy", "Hình sự nhẹ", 2500, 15],
    ["PC-203", "Chống đối người thi hành công vụ", "Hình sự nhẹ", 2000, 10],
    ["FL-301", "Tàng trữ vũ khí trái phép", "Trọng tội", 5000, 30],
    ["FL-302", "Cướp tài sản có vũ khí", "Trọng tội", 10000, 60],
    ["FL-303", "Bắt cóc con tin", "Trọng tội", 15000, 90],
    ["FL-304", "Tấn công sĩ quan", "Trọng tội", 8000, 45],
  ] as const;

  for (const [code, title, category, fine, jailMinutes] of charges) {
    await db.charge.upsert({
      where: { code },
      update: {},
      create: { code, title, category, fine, jailMinutes },
    });
  }

  const c = await db.citizen.upsert({
    where: { citizenId: "VN-000123" },
    update: {},
    create: {
      fullName: "Marcus Vega",
      citizenId: "VN-000123",
      phone: "555-0142",
      dob: "1994-03-12",
      tags: ["Có súng", "Hay bỏ chạy"],
      notes: "Liên quan băng nhóm Vagos.",
    },
  });
  await db.vehicle.upsert({
    where: { plate: "69ABC123" },
    update: {},
    create: { plate: "69ABC123", model: "Karin Sultan RS", color: "Đen", ownerId: c.id },
  });

  const exists = await db.announcement.count();
  if (!exists) {
    await db.announcement.create({
      data: {
        title: "Chào mừng đến với NCPD MDT",
        body: "Hệ thống đã sẵn sàng. Nhớ bật On-Duty và nhập Callsign trước khi vào ca.",
        pinned: true,
        authorId: chief.id,
      },
    });
  }
  console.log("Seed xong. Đăng nhập: chief / admin123 (HÃY ĐỔI MẬT KHẨU NGAY)");
}

main().finally(() => db.$disconnect());
