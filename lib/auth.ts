import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import type { Role } from "@prisma/client";
import { hasPersonnelManagement } from "./roles";

const COOKIE = "mdt_session";
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-secret-change-me-dev-secret-change-me");

export async function createSession(officerId: string) {
  const officer = await db.officer.findUnique({
    where: { id: officerId },
    select: { sessionVersion: true, active: true },
  });
  if (!officer?.active) throw new Error("Tài khoản không hoạt động.");
  const token = await new SignJWT({ sub: officerId, ver: officer.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("12h")
    .sign(secret());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export function destroySession() {
  cookies().delete(COOKIE);
}

export async function getOfficer() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const officer = await db.officer.findUnique({ where: { id: String(payload.sub) } });
    if (!officer || !officer.active || payload.ver !== officer.sessionVersion) return null;
    return officer;
  } catch {
    return null;
  }
}

export async function requireOfficer() {
  const o = await getOfficer();
  if (!o) redirect("/login");
  return o;
}

const LEVEL: Record<Role, number> = {
  OFFICER: 1,
  SUPERVISOR: 2,
  ACCOUNTING: 2,
  FTO: 2,
  HIGH_COMMAND: 3,
};

export async function requireRole(min: Role) {
  const o = await requireOfficer();
  if (LEVEL[o.role] < LEVEL[min]) throw new Error("Không đủ quyền hạn");
  return o;
}

export async function requirePersonnelManager() {
  const o = await requireOfficer();
  if (!hasPersonnelManagement(o.role, o.rank)) throw new Error("Không đủ quyền hạn");
  return o;
}

export const roleLabel = (role: Role) => ({
  OFFICER: "Officer",
  SUPERVISOR: "Supervisor",
  ACCOUNTING: "Phòng Kế Toán",
  FTO: "Phòng FTO",
  HIGH_COMMAND: "High Command",
}[role]);

export const isHC = (role: Role) => role === "HIGH_COMMAND";
