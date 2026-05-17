import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.ADMISSIONS_WRITE);
    const { admissionId } = await request.json();
    if (!admissionId) return NextResponse.json({ error: "admissionId requerido" }, { status: 400 });

    const admission = await db.admissions.findUnique({ where: { id: admissionId, school_id: ctx.schoolId } });
    if (!admission) return NextResponse.json({ error: "Admisión no encontrada" }, { status: 404 });
    if (admission.status !== "ADMITIDO") return NextResponse.json({ error: "Solo se pueden convertir admisiones en estado ADMITIDO" }, { status: 400 });

    // Check if student already exists for this document
    if (admission.document_number) {
      const existing = await db.students.findFirst({
        where: { document_number: admission.document_number, school_id: ctx.schoolId, deleted_at: null },
      });
      if (existing) return NextResponse.json({ error: "Ya existe un estudiante con ese documento" }, { status: 409 });
    }

    // Create student from admission data
    const student = await db.students.create({
      data: {
        school_id: ctx.schoolId,
        first_name: admission.first_name,
        last_name: admission.last_name,
        document_type: admission.document_type,
        document_number: admission.document_number,
        birth_date: admission.birth_date,
        address: admission.address ?? undefined,
        medical_notes: admission.medical_notes ?? undefined,
        emergency_contact: admission.emergency_contact ?? undefined,
        emergency_phone: admission.emergency_phone ?? undefined,
        admitted_at: new Date(),
      },
    });

    // Copy guardians from admission if any
    if (admission.guardian_name) {
      const guardian = await db.guardians.create({
        data: {
          school_id: ctx.schoolId,
          first_name: admission.guardian_name.split(" ")[0] ?? "Tutor",
          last_name: admission.guardian_name.split(" ").slice(1).join(" ") || "—",
          relationship: admission.guardian_relationship ?? "Tutor",
          phone: admission.guardian_phone ?? undefined,
          email: admission.guardian_email ?? undefined,
        },
      });
      await db.student_guardians.create({
        data: { student_id: student.id, guardian_id: guardian.id },
      });
    }

    // Enroll in desired grade if specified
    if (admission.desired_grade_id) {
      const section = await db.sections.findFirst({
        where: { grade_id: admission.desired_grade_id, school_id: ctx.schoolId, deleted_at: null },
      });
      if (section) {
        await db.enrollments.create({
          data: {
            student_id: student.id,
            grade_id: admission.desired_grade_id,
            section_id: section.id,
            academic_year_id: ctx.academicYearId,
            school_id: ctx.schoolId,
          },
        });
      }
    }

    // Copy documents
    const docs = await db.documents.findMany({
      where: { entity_type: "admission", entity_id: admissionId, deleted_at: null },
    });
    for (const doc of docs) {
      await db.documents.create({
        data: {
          school_id: ctx.schoolId,
          entity_type: "student",
          entity_id: student.id,
          filename: doc.filename,
          original_name: doc.original_name,
          mime_type: doc.mime_type,
          size_bytes: doc.size_bytes,
          url: doc.url,
          uploaded_by: ctx.userId,
        },
      });
    }

    // Mark admission as converted
    await db.admissions.update({
      where: { id: admissionId },
      data: { status: "MATRICULADO", notes: `${admission.notes ?? ""}\nConvertido a estudiante #${student.id.slice(0, 8)}` },
    });

    return NextResponse.json({ success: true, data: { student, admission: { id: admissionId, status: "MATRICULADO" } } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
