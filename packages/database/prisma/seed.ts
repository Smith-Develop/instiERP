import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const db = new PrismaClient();

async function createAuthUser(
  email: string,
  name: string,
  password: string,
  role: string,
) {
  const hashed = await hashPassword(password);
  const userId = crypto.randomUUID();

  const user = await db.user.create({
    data: {
      id: userId,
      email,
      name,
      emailVerified: true,
      role,
      image: null,
    },
  });

  await db.account.create({
    data: {
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashed,
    },
  });

  return user;
}

async function main() {
  console.log("🌱 Sembrando datos iniciales...\n");

  // 1. School
  const school = await db.schools.upsert({
    where: { slug: "colegio-demo" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Colegio Demo",
      slug: "colegio-demo",
      address: "Av. Principal 123",
      phone: "+34 900 000 000",
      email: "info@colegiodemo.edu",
    },
  });
  console.log(`  ✓ School: ${school.name}`);

  // 2. Academic Year
  const academicYear = await db.academic_years.upsert({
    where: { school_id_year_label: { school_id: school.id, year_label: "2026-2027" } },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      school_id: school.id,
      year_label: "2026-2027",
      start_date: new Date("2026-09-01"),
      end_date: new Date("2027-06-30"),
      is_active: true,
    },
  });
  console.log(`  ✓ Academic Year: ${academicYear.year_label}`);

  // 3. Auth Users (con passwords hasheados)
  console.log("\n  Creando usuarios con autenticación...");

  const adminUser = await createAuthUser(
    "admin@insti.dev",
    "Admin Principal",
    "admin123",
    "SUPER_ADMIN",
  );
  console.log(`    ✓ admin@insti.dev (pass: admin123)`);

  const secretariaUser = await createAuthUser(
    "secretaria@insti.dev",
    "María Secretaría",
    "secre123",
    "SECRETARIA",
  );
  console.log(`    ✓ secretaria@insti.dev (pass: secre123)`);

  const profesorUser = await createAuthUser(
    "profesor@insti.dev",
    "Carlos Profesor",
    "profe123",
    "PROFESOR",
  );
  console.log(`    ✓ profesor@insti.dev (pass: profe123)`);

  const padreUser = await createAuthUser(
    "padre@insti.dev",
    "José Padre",
    "padre123",
    "PADRE",
  );
  console.log(`    ✓ padre@insti.dev (pass: padre123)`);

  // 4. User-School roles
  console.log("\n  Asignando roles por colegio...");
  const userRoles = [
    { user_id: adminUser.id, school_id: school.id, role: "SUPER_ADMIN" },
    { user_id: secretariaUser.id, school_id: school.id, role: "SECRETARIA" },
    { user_id: profesorUser.id, school_id: school.id, role: "PROFESOR" },
    { user_id: padreUser.id, school_id: school.id, role: "PADRE" },
  ];

  for (const r of userRoles) {
    await db.user_schools.upsert({
      where: { user_id_school_id: { user_id: r.user_id, school_id: r.school_id } },
      update: { role: r.role },
      create: r,
    });
  }
  console.log("    ✓ 4 roles asignados");

  // 5. Academic Levels
  console.log("\n  Configuración académica...");
  const primaria = await db.academic_levels.upsert({
    where: { school_id_name: { school_id: school.id, name: "Primaria" } },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000020",
      school_id: school.id,
      name: "Primaria",
      sort_order: 1,
    },
  });

  const secundaria = await db.academic_levels.upsert({
    where: { school_id_name: { school_id: school.id, name: "Secundaria" } },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000021",
      school_id: school.id,
      name: "Secundaria",
      sort_order: 2,
    },
  });
  console.log(`    ✓ Niveles: Primaria, Secundaria`);

  // 6. Grades
  const gradesData = [
    { id: "00000000-0000-0000-0000-000000000030", academic_level_id: primaria.id, name: "1º", sort_order: 1 },
    { id: "00000000-0000-0000-0000-000000000031", academic_level_id: primaria.id, name: "2º", sort_order: 2 },
    { id: "00000000-0000-0000-0000-000000000032", academic_level_id: primaria.id, name: "3º", sort_order: 3 },
    { id: "00000000-0000-0000-0000-000000000033", academic_level_id: secundaria.id, name: "1º", sort_order: 4 },
    { id: "00000000-0000-0000-0000-000000000034", academic_level_id: secundaria.id, name: "2º", sort_order: 5 },
  ];

  for (const g of gradesData) {
    await db.grades.upsert({
      where: { school_id_academic_level_id_name: { school_id: school.id, academic_level_id: g.academic_level_id, name: g.name } },
      update: {},
      create: { ...g, school_id: school.id },
    });
  }
  console.log(`    ✓ ${gradesData.length} grados`);

  // 7. Sections
  const sectionsData = [
    { id: "00000000-0000-0000-0000-000000000040", grade_id: gradesData[0]!.id, name: "A", sort_order: 1 },
    { id: "00000000-0000-0000-0000-000000000041", grade_id: gradesData[0]!.id, name: "B", sort_order: 2 },
    { id: "00000000-0000-0000-0000-000000000042", grade_id: gradesData[1]!.id, name: "A", sort_order: 1 },
    { id: "00000000-0000-0000-0000-000000000043", grade_id: gradesData[3]!.id, name: "A", sort_order: 1 },
  ];

  for (const s of sectionsData) {
    await db.sections.upsert({
      where: { grade_id_name: { grade_id: s.grade_id, name: s.name } },
      update: {},
      create: { ...s, school_id: school.id },
    });
  }
  console.log(`    ✓ ${sectionsData.length} secciones`);

  // 8. Students
  console.log("\n  Creando estudiantes...");
  const studentsData = [
    { first_name: "Ana", last_name: "García", document_number: "12345678A" },
    { first_name: "Luis", last_name: "Martínez", document_number: "23456789B" },
    { first_name: "Sofía", last_name: "López", document_number: "34567890C" },
    { first_name: "Diego", last_name: "Hernández", document_number: "45678901D" },
    { first_name: "Valentina", last_name: "Ruiz", document_number: "56789012E" },
    { first_name: "Mateo", last_name: "Díaz", document_number: "67890123F" },
    { first_name: "Camila", last_name: "Torres", document_number: "78901234G" },
    { first_name: "Nicolás", last_name: "Flores", document_number: "89012345H" },
  ];

  const createdStudents: { id: string }[] = [];
  for (let i = 0; i < studentsData.length; i++) {
    const s = await db.students.upsert({
      where: { id: `00000000-0000-0000-0000-${String(i + 50).padStart(12, "0")}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-${String(i + 50).padStart(12, "0")}`,
        school_id: school.id,
        ...studentsData[i],
      },
    });
    createdStudents.push(s);
  }
  console.log(`    ✓ ${studentsData.length} estudiantes`);

  // 9. Enrollments
  console.log("  Matriculando...");
  const section1A = sectionsData[0]!;
  const section1ASec = sectionsData[3]!;

  for (let i = 0; i < 4; i++) {
    await db.enrollments.upsert({
      where: { student_id_academic_year_id: { student_id: createdStudents[i]!.id, academic_year_id: academicYear.id } },
      update: {},
      create: {
        student_id: createdStudents[i]!.id,
        grade_id: section1A.grade_id,
        section_id: section1A.id,
        academic_year_id: academicYear.id,
        school_id: school.id,
      },
    });
  }

  for (let i = 4; i < 8; i++) {
    await db.enrollments.upsert({
      where: { student_id_academic_year_id: { student_id: createdStudents[i]!.id, academic_year_id: academicYear.id } },
      update: {},
      create: {
        student_id: createdStudents[i]!.id,
        grade_id: section1ASec.grade_id,
        section_id: section1ASec.id,
        academic_year_id: academicYear.id,
        school_id: school.id,
      },
    });
  }
  console.log(`    ✓ 8 matrículas`);

  // 10. Teachers
  console.log("  Creando profesores...");
  const teachersData = [
    { first_name: "Carlos", last_name: "Profesor", specialties: "Matemáticas" },
    { first_name: "Laura", last_name: "Ciencias", specialties: "Física, Química" },
    { first_name: "Miguel", last_name: "Literatura", specialties: "Lengua, Literatura" },
  ];

  const createdTeachers: { id: string }[] = [];
  for (let i = 0; i < teachersData.length; i++) {
    const t = await db.teachers.upsert({
      where: { id: `00000000-0000-0000-0000-${String(i + 70).padStart(12, "0")}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-${String(i + 70).padStart(12, "0")}`,
        school_id: school.id,
        ...teachersData[i],
        user_id: i === 0 ? profesorUser.id : undefined,
      },
    });
    createdTeachers.push(t);
  }
  console.log(`    ✓ ${teachersData.length} profesores`);

  // 11. Subjects
  console.log("  Creando asignaturas...");
  const subjectsData = [
    { name: "Matemáticas", code: "MAT" },
    { name: "Lengua Española", code: "LEN" },
    { name: "Ciencias Naturales", code: "CN" },
    { name: "Ciencias Sociales", code: "CS" },
    { name: "Inglés", code: "ING" },
    { name: "Educación Física", code: "EF" },
  ];

  const createdSubjects: { id: string; name: string }[] = [];
  for (let i = 0; i < subjectsData.length; i++) {
    const sub = await db.subjects.upsert({
      where: { school_id_name: { school_id: school.id, name: subjectsData[i]!.name } },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-${String(i + 80).padStart(12, "0")}`,
        school_id: school.id,
        ...subjectsData[i],
      },
    });
    createdSubjects.push(sub);
  }
  console.log(`    ✓ ${subjectsData.length} asignaturas`);

  // 12. Guardians
  console.log("  Creando tutores...");
  const guardiansData = [
    { first_name: "José", last_name: "Padre", relationship: "Padre", phone: "+34 600 000 001" },
    { first_name: "Elena", last_name: "García", relationship: "Madre", phone: "+34 600 000 002" },
  ];

  for (let i = 0; i < guardiansData.length; i++) {
    await db.guardians.upsert({
      where: { id: `00000000-0000-0000-0000-${String(i + 90).padStart(12, "0")}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-${String(i + 90).padStart(12, "0")}`,
        school_id: school.id,
        ...guardiansData[i],
        user_id: i === 0 ? padreUser.id : undefined,
      },
    });
  }
  console.log(`    ✓ ${guardiansData.length} tutores`);

  // 13. Attendance seed (last 5 days for 1ºA Primaria)
  console.log("\n  Generando asistencias de prueba...");
  const today = new Date();
  let count = 0;
  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const student of createdStudents.slice(0, 4)) {
      const statuses = ["PRESENTE", "PRESENTE", "PRESENTE", "PRESENTE", "TARDANZA", "AUSENTE", "JUSTIFICADO"];
      const randomStatus = statuses[Math.floor(Math.random() * (dayOffset === 0 ? 1 : statuses.length))]!;
      await db.attendances
        .upsert({
          where: { student_id_date: { student_id: student.id, date } },
          update: { status: randomStatus },
          create: {
            school_id: school.id,
            academic_year_id: academicYear.id,
            student_id: student.id,
            section_id: section1A.id,
            date,
            status: randomStatus,
          },
        })
        .catch(() => {}); // Ignore duplicates
      count++;
    }
  }
  console.log(`    ✓ ~${count} registros de asistencia`);

  // 14. Grade Items seed
  console.log("  Creando criterios de evaluación...");
  const matSubject = createdSubjects.find((s) => s.name === "Matemáticas")!;
  const defaultItems = [
    { name: "Exámenes", weight: 0.6 },
    { name: "Tareas", weight: 0.3 },
    { name: "Actitud", weight: 0.1 },
  ];

  for (const item of defaultItems) {
    await db.grade_items
      .upsert({
        where: {
          id: `00000000-0000-0000-0000-${String(100 + defaultItems.indexOf(item)).padStart(12, "0")}`,
        },
        update: {},
        create: {
          id: `00000000-0000-0000-0000-${String(100 + defaultItems.indexOf(item)).padStart(12, "0")}`,
          school_id: school.id,
          academic_year_id: academicYear.id,
          subject_id: matSubject.id,
          grade_id: section1A.grade_id,
          section_id: section1A.id,
          name: item.name,
          weight: item.weight,
          period: "TRIMESTRE_1",
        },
      })
      .catch(() => {});
  }
  console.log(`    ✓ 3 criterios de evaluación para ${matSubject.name}`);

  // 15. Announcements
  console.log("  Creando anuncios de prueba...");
  const announcementData = [
    { title: "Bienvenida al curso 2026-2027", content: "Estimadas familias, les damos la bienvenida al nuevo año escolar. Las clases comienzan el 1 de septiembre.", target: "PADRES" },
    { title: "Reunión de profesores", content: "Se convoca a todo el claustro a la reunión de inicio de curso el viernes 29 de agosto a las 10:00 en la sala de profesores.", target: "PROFESORES" },
    { title: "Festival de fin de curso", content: "¡Reserven la fecha! El festival de fin de curso será el 20 de junio. Habrá actuaciones, comida y actividades para todos.", target: "TODOS" },
  ];
  for (const a of announcementData) {
    await db.announcements.create({ data: { ...a, school_id: school.id, author_id: adminUser.id } }).catch(() => {});
  }
  console.log(`    ✓ ${announcementData.length} anuncios`);

  // 16. Events
  console.log("  Creando eventos de prueba...");
  const eventData = [
    { title: "Inicio de clases", description: "Primer día de clases del curso 2026-2027", start_date: new Date("2026-09-01"), end_date: new Date("2026-09-01"), target: "TODOS" },
    { title: "Vacaciones de Navidad", description: "Sin clases del 23 de diciembre al 7 de enero", start_date: new Date("2026-12-23"), end_date: new Date("2027-01-07"), target: "TODOS" },
    { title: "Exámenes finales", description: "Semana de exámenes del primer trimestre", start_date: new Date("2026-12-15"), end_date: new Date("2026-12-19"), target: "ESTUDIANTES" },
  ];
  for (const ev of eventData) {
    await db.events.create({ data: { ...ev, school_id: school.id, created_by: adminUser.id } }).catch(() => {});
  }
  console.log(`    ✓ ${eventData.length} eventos`);

  // 17. Invoices
  console.log("  Creando facturas de prueba...");
  const invoiceData = [
    { student_id: createdStudents[0]!.id, concept: "Matrícula 2026-2027", amount: 350, status: "PAGADO" as const },
    { student_id: createdStudents[1]!.id, concept: "Matrícula 2026-2027", amount: 350, status: "PENDIENTE" as const },
    { student_id: createdStudents[2]!.id, concept: "Comedor — Septiembre", amount: 120, status: "PAGADO" as const },
    { student_id: createdStudents[3]!.id, concept: "Transporte escolar", amount: 80, status: "PENDIENTE" as const },
  ];
  for (const inv of invoiceData) {
    await db.invoices.create({
      data: {
        ...inv,
        school_id: school.id,
        academic_year_id: academicYear.id,
        currency: "EUR",
        due_date: new Date(Date.now() + 30 * 86400000),
        paid_at: inv.status === "PAGADO" ? new Date() : null,
      },
    }).catch(() => {});
  }
  console.log(`    ✓ ${invoiceData.length} facturas`);

  console.log("\n✅ Seed completado.");
  console.log("\n📧 Credenciales de prueba:");
  console.log("   admin@insti.dev       / admin123   (SUPER_ADMIN)");
  console.log("   secretaria@insti.dev  / secre123   (SECRETARIA)");
  console.log("   profesor@insti.dev    / profe123   (PROFESOR)");
  console.log("   padre@insti.dev       / padre123   (PADRE)");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
