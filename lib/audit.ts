import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function recordAudit(
  tx: Prisma.TransactionClient,
  entry: {
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    summary: string;
  }
) {
  await tx.auditLog.create({ data: entry });
}

export async function auditedMutation<T>(
  actorId: string,
  action: string,
  entityType: string,
  mutation: (tx: Prisma.TransactionClient) => Promise<{ result: T; entityId: string; summary: string }>
) {
  return db.$transaction(async (tx) => {
    const outcome = await mutation(tx);
    await recordAudit(tx, {
      actorId,
      action,
      entityType,
      entityId: outcome.entityId,
      summary: outcome.summary,
    });
    return outcome.result;
  });
}
