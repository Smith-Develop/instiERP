"use server";

import { db } from "@insti/database";
import { guardianSchema } from "./schemas";
import { revalidatePath } from "next/cache";

export async function getGuardians(schoolId: string) {
  return db.guardians.findMany({ where: { school_id: schoolId, deleted_at: null }, orderBy: { last_name: "asc" } });
}

export async function createGuardian(data: { first_name: string; last_name: string; relationship?: string; phone?: string; email?: string }, schoolId: string) {
  const parsed = guardianSchema.parse(data);
  const guardian = await db.guardians.create({ data: { ...parsed, school_id: schoolId, email: parsed.email || null } });
  revalidatePath("/dashboard/guardians");
  return guardian;
}

export async function updateGuardian(id: string, data: Record<string, unknown>) {
  const guardian = await db.guardians.update({ where: { id }, data });
  revalidatePath("/dashboard/guardians");
  return guardian;
}

export async function deleteGuardian(id: string) {
  await db.guardians.update({ where: { id }, data: { deleted_at: new Date() } });
  revalidatePath("/dashboard/guardians");
}
