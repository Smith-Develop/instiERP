import { z } from "zod";

export const studentSchema = z.object({
  first_name: z.string().min(1, "Nombre requerido").max(100),
  last_name: z.string().min(1, "Apellido requerido").max(100),
  document_type: z.string().optional(),
  document_number: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(["M", "F", "OTRO"]).optional(),
  address: z.string().optional(),
  medical_notes: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  photo_url: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type StudentInput = z.infer<typeof studentSchema>;

export const enrollmentSchema = z.object({
  student_id: z.string().uuid(),
  grade_id: z.string().uuid(),
  section_id: z.string().uuid(),
  academic_year_id: z.string().uuid(),
  school_id: z.string().uuid(),
});

export type EnrollmentInput = z.infer<typeof enrollmentSchema>;

export const guardianSchema = z.object({
  first_name: z.string().min(1, "Nombre requerido").max(100),
  last_name: z.string().min(1, "Apellido requerido").max(100),
  relationship: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  is_primary: z.boolean().default(false),
});

export type GuardianInput = z.infer<typeof guardianSchema>;
