import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOfficer } from "@/lib/auth";

// Global search (Ctrl+K): công dân theo Tên/Căn cước/SĐT, xe theo biển số.
export async function GET(req: Request) {
  const officer = await getOfficer();
  if (!officer || officer.mustChangePassword) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ citizens: [], vehicles: [] });

  const [citizens, vehicles] = await Promise.all([
    db.citizen.findMany({
      where: {
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { citizenId: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
        ],
      },
      select: { id: true, fullName: true, citizenId: true, tags: true },
      take: 6,
    }),
    db.vehicle.findMany({
      where: { plate: { contains: q.replace(/[\s-]/g, ""), mode: "insensitive" } },
      select: { id: true, plate: true, model: true, color: true, stolen: true, owner: { select: { id: true, fullName: true } } },
      take: 6,
    }),
  ]);
  return NextResponse.json({ citizens, vehicles });
}
