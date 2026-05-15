export type Role = "SUPER_ADMIN" | "DIRECTOR" | "SECRETARIA" | "PROFESOR" | "PADRE" | "ESTUDIANTE" | "CONTABILIDAD";

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AttendanceStatus = "PRESENTE" | "AUSENTE" | "TARDANZA" | "JUSTIFICADO";

export type AuditFields = {
  id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

export type TenantFields = {
  school_id: string;
  academic_year_id: string;
};
