import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get("sectionId");
    const date = searchParams.get("date");

    if (!sectionId || !date) {
      return NextResponse.json(
        { error: "sectionId y date son requeridos" },
        { status: 400 },
      );
    }

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get enrolled students for this section
    const enrollments = await db.enrollments.findMany({
      where: { section_id: sectionId, deleted_at: null, is_active: true },
      include: {
        student: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    // Get existing attendance records for this date
    const existingAttendance = await db.attendances.findMany({
      where: {
        section_id: sectionId,
        date: { gte: dateObj, lt: nextDay },
        deleted_at: null,
      },
    });

    const attendanceMap = new Map(
      existingAttendance.map((a) => [a.student_id, a.status]),
    );

    const students = enrollments.map((enrollment) => ({
      studentId: enrollment.student.id,
      studentName: `${enrollment.student.last_name}, ${enrollment.student.first_name}`,
      status: attendanceMap.get(enrollment.student.id) ?? "PRESENTE",
    }));

    // Sort alphabetically
    students.sort((a, b) => a.studentName.localeCompare(b.studentName));

    return NextResponse.json({ students, date, sectionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sectionId, date, schoolId, academicYearId, attendances } = body as {
      sectionId: string;
      date: string;
      schoolId: string;
      academicYearId: string;
      attendances: { studentId: string; status: string }[];
    };

    if (!sectionId || !date || !attendances?.length) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 },
      );
    }

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    // Upsert each attendance record
    const results = await Promise.all(
      attendances.map((att) =>
        db.attendances.upsert({
          where: {
            student_id_date: {
              student_id: att.studentId,
              date: dateObj,
            },
          },
          update: { status: att.status },
          create: {
            school_id: schoolId,
            academic_year_id: academicYearId,
            student_id: att.studentId,
            section_id: sectionId,
            date: dateObj,
            status: att.status,
          },
        }),
      ),
    );

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al guardar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
