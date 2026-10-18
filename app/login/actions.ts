"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export type LoginState = {
  error?: string;
  success?: boolean;
  officer?: {
    fullName: string;
    badge: string;
    rank: string;
  };
  redirectUrl?: string;
} | null;

export async function login(_: LoginState, fd: FormData): Promise<LoginState> {
  const reqHeaders = headers();
  const forwarded = reqHeaders.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : (reqHeaders.get("x-real-ip") ?? "127.0.0.1");

  // Giới hạn 10 lần thử đăng nhập trong 1 phút cho mỗi địa chỉ IP
  const ipLimit = rateLimit(`login:ip:${ip}`, { limit: 10, windowSeconds: 60 });
  if (!ipLimit.success) {
    return {
      error: `Bạn đã thao tác quá nhanh. Vui lòng chờ ${ipLimit.resetSeconds} giây trước khi thử lại.`,
    };
  }

  const username = String(fd.get("username") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");

  // Giới hạn 5 lần thử đăng nhập cho cùng 1 username trong 60 giây (chống brute force 1 tài khoản)
  if (username) {
    const userLimit = rateLimit(`login:user:${username}`, { limit: 5, windowSeconds: 60 });
    if (!userLimit.success) {
      return {
        error: `Tài khoản ${username} đang bị tạm khóa thao tác do nhập sai liên tục. Vui lòng chờ ${userLimit.resetSeconds} giây.`,
      };
    }
  }

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
  const redirectUrl = officer.mustChangePassword ? "/first-login-password" : "/mdt";
  return {
    success: true,
    officer: {
      fullName: officer.fullName,
      badge: officer.badge,
      rank: officer.rank,
    },
    redirectUrl,
  };
}

export async function logout() {
  destroySession();
  redirect("/login");
}
