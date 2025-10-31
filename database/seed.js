// database/seed.js
// Ejecuta: node --env-file=.env database/seed.js
import { fakerES_MX as faker } from "@faker-js/faker";
import { createClient } from "@supabase/supabase-js";

// --- Config directa desde .env (sin dotenv) ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Faltan VITE_SUPABASE_URL o SERVICE_ROLE_KEY en .env");
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// --- Parámetros del seed (ajusta si quieres) ---
const YEAR_LABEL = Number(process.env.YEAR_LABEL || new Date().getFullYear());
const GRADES = [1, 2, 3, 4, 5];
const SECTIONS = ["A", "B"]; // 2 por grado → 10 aulas
const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];
const COURSE_LIST = [
  ["Matemática", "MAT"],
  ["Comunicación", "COM"],
  ["Ciencia y Tecnología", "CST"],
  ["Historia", "HIS"],
  ["Geografía", "GEO"],
  ["Inglés", "ING"],
  ["Educación Física", "EFI"],
  ["Arte", "ART"],
  ["Educación Cívica", "CIV"],
  ["Computación", "INF"],
];
const ENROLLMENT_STATES = ["active", "withdrawn", "transferred"];

// --- Utilidades ---
const chunked = async (arr, size, fn) => {
  for (let i = 0; i < arr.length; i += size) await fn(arr.slice(i, i + size));
};
const pickN = (arr, n) => {
  const a = [...arr];
  const r = [];
  while (r.length < n && a.length) {
    r.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
  }
  return r;
};

// --- Limpieza simple (idempotente) ---
async function clean() {
  // Orden por dependencias
  await sb.from("enrollments").delete().neq("id", 0);
  await sb.from("schedules").delete().neq("id", 0);
  await sb.from("course_offerings").delete().neq("id", 0);
  await sb.from("classrooms").delete().neq("id", 0);
  await sb.from("courses").delete().neq("id", 0);
  await sb.from("students").delete().neq("id", 0);
  await sb.from("teachers").delete().neq("id", 0);
  await sb.from("academic_years").delete().neq("id", 0);
}

async function main() {
  console.log("🧹 Cleaning (safe)...");
  await clean();

  // 1) academic_years
  console.log("📅 Seeding academic_years…");
  const { data: ay, error: ayErr } = await sb
    .from("academic_years")
    .insert([{ year_label: YEAR_LABEL, status: "open" }])
    .select("id")
    .single();
  if (ayErr) throw ayErr;
  const academic_year_id = ay.id;

  // 2) teachers (~30)
  console.log("👩‍🏫 Seeding teachers…");
  const teachers = Array.from({ length: 30 }, () => ({
    full_name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.phone.number(),
  }));
  await chunked(teachers, 1000, async (rows) => {
    const { error } = await sb.from("teachers").insert(rows);
    if (error) throw error;
  });
  const { data: teachersDB, error: tErr } = await sb
    .from("teachers")
    .select("id, full_name");
  if (tErr) throw tErr;
  const teacherIds = teachersDB.map((t) => t.id);

  // 3) courses (10)
  console.log("📚 Seeding courses…");
  const courses = COURSE_LIST.map(([name, code]) => ({ name, code }));
  await chunked(courses, 1000, async (rows) => {
    const { error } = await sb.from("courses").insert(rows);
    if (error) throw error;
  });
  const { data: coursesDB, error: cErr } = await sb.from("courses").select("id, code");
  if (cErr) throw cErr;

  // 4) classrooms (1..5 x A/B) con teacher_ids[] y homeroom_teacher_id
  console.log("🏫 Seeding classrooms…");
  const classrooms = [];
  for (const g of GRADES) {
    for (const s of SECTIONS) {
      const homeroom = faker.helpers.arrayElement(teacherIds);
      const extra = pickN(teacherIds, 2);
      const teacher_ids = Array.from(new Set([homeroom, ...extra])); // bigint[]
      classrooms.push({
        academic_year_id,
        grade_level: g,
        section: s,
        homeroom_teacher_id: homeroom,
        teacher_ids,
      });
    }
  }
  await chunked(classrooms, 1000, async (rows) => {
    const { error } = await sb.from("classrooms").insert(rows);
    if (error) throw error;
  });
  const { data: classroomsDB, error: clsErr } = await sb
    .from("classrooms")
    .select("id, academic_year_id, grade_level, section");
  if (clsErr) throw clsErr;

  // 5) course_offerings: por cada aula, 5 cursos con 5 docentes
  console.log("🧩 Seeding course_offerings…");
  const offerings = [];
  for (const classroom of classroomsDB) {
    const selCourses = pickN(coursesDB, 5);
    const selTeachers = pickN(teacherIds, 5);
    for (let i = 0; i < selCourses.length; i++) {
      offerings.push({
        classroom_id: classroom.id,
        course_id: selCourses[i].id,
        teacher_id: selTeachers[i],
      });
    }
  }
  await chunked(offerings, 1000, async (rows) => {
    const { error } = await sb.from("course_offerings").insert(rows);
    if (error) throw error;
  });
  const { data: offeringsDB, error: offErr } = await sb
    .from("course_offerings")
    .select("id");
  if (offErr) throw offErr;

  // 6) schedules: 2 slots por offering (sin pelear con unique)
  console.log("🗓️ Seeding schedules…");
  const schedules = [];
  for (const off of offeringsDB) {
    const chosen = pickN(DAYS, 2);
    for (const d of chosen) {
      // 08:00-09:30 o 10:00-11:30 de forma simple
      const startHour = faker.helpers.arrayElement([8, 10, 12, 14]);
      const start = `${String(startHour).padStart(2, "0")}:00:00`;
      const end = `${String(startHour + 1).padStart(2, "0")}:30:00`;
      schedules.push({
        course_offering_id: off.id,
        day_of_week: d,
        starts_at: start,
        ends_at: end,
        room: String(faker.number.int({ min: 100, max: 150 })),
      });
    }
  }
  await chunked(schedules, 1000, async (rows) => {
    const { error } = await sb.from("schedules").insert(rows);
    if (error) throw error;
  });

  // 7) students (~100)
  console.log("👩‍🎓 Seeding students…");
  const students = Array.from({ length: 100 }, () => ({
    full_name: faker.person.fullName(),
    dni: faker.string.numeric(8),
    birth_date: faker.date.birthdate({ min: 13, max: 17, mode: "age" }),
    guardian_name: faker.person.fullName(),
    guardian_phone: faker.phone.number(),
  }));
  await chunked(students, 1000, async (rows) => {
    const { error } = await sb.from("students").insert(rows);
    if (error) throw error;
  });
  const { data: studentsDB, error: sErr } = await sb.from("students").select("id");
  if (sErr) throw sErr;

  // 8) enrollments: cada estudiante se matricula en un classroom del MISMO año
  console.log("📝 Seeding enrollments…");
  const enrollments = studentsDB.map((stu) => {
    const classroom = faker.helpers.arrayElement(classroomsDB); // todas son del mismo academic_year_id
    return {
      student_id: stu.id,
      academic_year_id, // <-- AÑO EN LA MATRÍCULA
      classroom_id: classroom.id, // FK compuesta validará que sea del mismo año
      status: faker.helpers.arrayElement(ENROLLMENT_STATES),
      enrolled_at: faker.date.between({
        from: `${YEAR_LABEL}-02-01`,
        to: `${YEAR_LABEL}-03-31`,
      }),
    };
  });

  await chunked(enrollments, 1000, async (rows) => {
    const { error } = await sb.from("enrollments").insert(rows);
    if (error) throw error;
  });

  console.log("✅ Seed completo.");
}

main().catch((e) => {
  console.error("💥 Seed error:", e);
  process.exit(1);
});
