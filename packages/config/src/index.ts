export const APP_NAME = "Insti";
export const APP_DESCRIPTION = "ERP Escolar SaaS";

export const ROLES = [
  "SUPER_ADMIN",
  "DIRECTOR",
  "SECRETARIA",
  "PROFESOR",
  "PADRE",
  "ESTUDIANTE",
  "CONTABILIDAD",
] as const;

export const ATTENDANCE_STATUSES = [
  "PRESENTE",
  "AUSENTE",
  "TARDANZA",
  "JUSTIFICADO",
] as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
