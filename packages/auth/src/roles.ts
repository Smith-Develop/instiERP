import type { Role } from "@insti/types";

export const ROLES = [
  "SUPER_ADMIN",
  "DIRECTOR",
  "SECRETARIA",
  "PROFESOR",
  "PADRE",
  "ESTUDIANTE",
  "CONTABILIDAD",
] as const;

export type { Role };

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN: ["*"],
  DIRECTOR: [
    "students:read", "students:write",
    "teachers:read", "teachers:write",
    "attendance:read", "attendance:write",
    "grades:read", "grades:write",
    "reports:read",
    "communication:read", "communication:write",
    "finance:read",
    "settings:read", "settings:write",
    "users:read", "users:write",
  ],
  SECRETARIA: [
    "students:read", "students:write",
    "guardians:read", "guardians:write",
    "admissions:read", "admissions:write",
    "enrollments:read", "enrollments:write",
    "certificates:read", "certificates:write",
    "finance:read",
    "communication:read",
    "settings:read",
  ],
  PROFESOR: [
    "students:read",
    "attendance:read", "attendance:write",
    "grades:read", "grades:write",
    "behavior:read", "behavior:write",
    "communication:read", "communication:write",
    "schedule:read",
  ],
  PADRE: [
    "students:read",
    "attendance:read",
    "grades:read",
    "communication:read", "communication:write",
    "finance:read",
    "payments:write",
  ],
  ESTUDIANTE: [
    "schedule:read",
    "grades:read",
    "attendance:read",
    "communication:read",
    "assignments:read",
  ],
  CONTABILIDAD: [
    "students:read",
    "finance:read", "finance:write",
    "payments:read", "payments:write",
    "invoices:read", "invoices:write",
    "reports:read",
  ],
};
