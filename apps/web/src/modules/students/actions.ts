"use server";

import { db } from "@insti/database";
import { studentSchema } from "./schemas";
import { revalidatePath } from "next/cache";

export async function getStudents(schoolId: string, academicYearId: string) {
  return db.students.findMany({
    where: { school_id: schoolId, deleted_at: null },
    include: {
      enrollments: {
        where: { academic_year_id: academicYearId, deleted_at: null },
        include: { grade: true, section: true },
      },
      student_guardians: {
        where: { deleted_at: null },
        include: { guardian: true },
      },
    },
    orderBy: { last_name: "asc" },
  });
}

export async function getStudentById(id: string) {
  return db.students.findUnique({
    where: { id },
    include: {
      enrollments: {
        where: { deleted_at: null },
        include: { grade: true, section: true, academic_year: true },
      },
      student_guardians: {
        where: { deleted_at: null },
        include: { guardian: true },
      },
      attendances: { take: 30, orderBy: { date: "desc" } },
    },
  });
}

export async function createStudent(
  data: { first_name: string; last_name: string; document_type?: string; document_number?: string; birth_date?: string; gender?: string; address?: string; medical_notes?: string; emergency_contact?: string; emergency_phone?: string },
  schoolId: string,
) {
  const parsed = studentSchema.parse(data);
  const student = await db.students.create({
    data: {
      ...parsed,
      birth_date: parsed.birth_date ? new Date(parsed.birth_date) : undefined,
      school_id: schoolId,
    },
  });
  revalidatePath("/dashboard/students");
  return student;
}

export async function updateStudent(
  id: string,
  data: { first_name?: string; last_name?: string; document_type?: string; document_number?: string; birth_date?: string; gender?: string; address?: string; medical_notes?: string; emergency_contact?: string; emergency_phone?: string; is_active?: boolean },
) {
  const student = await db.students.update({
    where: { id },
    data: {
      ...data,
      birth_date: data.birth_date ? new Date(data.birth_date) : undefined,
    },
  });
  revalidatePath("/dashboard/students");
  return student;
}

export async function deleteStudent(id: string) {
  await db.students.update({
    where: { id },
    data: { deleted_at: new Date() },
  });
  revalidatePath("/dashboard/students");
}

export async function getStudentCount(schoolId: string) {
  return db.students.count({
    where: { school_id: schoolId, deleted_at: null },
  });
}
