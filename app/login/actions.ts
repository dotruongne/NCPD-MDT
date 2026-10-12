"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

export async function login(_: { error?: string } | null, fd: FormData) {
  const username = String(fd.get("username") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const officer = await db.officer.findUnique({ where: { username } });
  const ok = await bcrypt.compare(password, officer?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi");
  const now = new Date();
  if (officer?.loginLockedUntil && officer.loginLockedUntil <= now) {
    await db.officer.update({
      where: { id: officer.id },
      data: { failedLoginAttempts: 0, loginLockedUntil: null },
    });
  }
  if (!officer || !officer.active || !ok || (officer.loginLockedUntil && officer.loginLockedUntil > now)) {
    if (officer?.active && !(officer.loginLockedUntil && officer.loginLockedUntil > now)) {
      const updated = await db.officer.update({
        where: { id: officer.id },
        data: { failedLoginAttempts: { increment: 1 } },
        select: { failedLoginAttempts: true, loginLockedUntil: true },
      });
      if (updated.failedLoginAttempts >= 5) {
        await db.officer.updateMany({
          where: { id: officer.id, loginLockedUntil: null },
          data: { failedLoginAttempts: 0, loginLockedUntil: new Date(now.getTime() + 15 * 60 * 1000) },
        });
      }
    }
    return { error: "Sai tài khoản hoặc mật khẩu, hoặc tài khoản đang tạm khóa." };
  }
  if (officer.failedLoginAttempts || officer.loginLockedUntil) {
    await db.officer.update({
      where: { id: officer.id },
      data: { failedLoginAttempts: 0, loginLockedUntil: null },
    });
  }
  await createSession(officer.id);
  redirect("/mdt");
}

export async function logout() {
  destroySession();
  redirect("/login");
}
