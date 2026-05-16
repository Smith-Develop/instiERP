import { db } from "@insti/database";

export async function auditLog(
  schoolId: string,
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string | null,
): Promise<void> {
  await db.audit_logs
    .create({
      data: {
        school_id: schoolId,
        user_id: userId,
        action,
        entity,
        entity_id: entityId ?? null,
      },
    })
    .catch(() => {});
}
