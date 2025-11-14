<template>
  <div class="dashboard">
    <!-- CABECERA DEL DASHBOARD -->
    <header class="header">
      <div>
        <h1 class="title">Panel Principal</h1>
        <p class="subtitle">Resumen general del sistema de matrículas</p>
      </div>

      <RouterLink class="btn solid" to="/enrrollments/new">
        <span class="badge-new">NEW</span>
        <span> Nueva matrícula (Ficha)</span>
      </RouterLink>
    </header>

    <!-- MÉTRICAS -->
    <section class="cards">
      <RouterLink class="card card-enrollments" to="/enrrollments">
        <div class="card-main">
          <div>
            <p class="card-label">Matrículas</p>
            <p class="card-number">{{ counts.enrollments ?? "—" }}</p>
          </div>
          <div class="card-illustration enrollments"></div>
        </div>
        <p class="card-footer">Ver matrículas →</p>
      </RouterLink>

      <RouterLink class="card card-students" to="/students">
        <div class="card-main">
          <div>
            <p class="card-label">Estudiantes</p>
            <p class="card-number">{{ counts.students ?? "—" }}</p>
          </div>
          <div class="card-illustration students"></div>
        </div>
        <p class="card-footer">Ver estudiantes →</p>
      </RouterLink>

      <RouterLink class="card card-teachers" to="/teachers">
        <div class="card-main">
          <div>
            <p class="card-label">Docentes</p>
            <p class="card-number">{{ counts.teachers ?? "—" }}</p>
          </div>
          <div class="card-illustration teachers"></div>
        </div>
        <p class="card-footer">Ver docentes →</p>
      </RouterLink>

      <RouterLink class="card card-classrooms" to="/classrooms">
        <div class="card-main">
          <div>
            <p class="card-label">Aulas (Grado/Sección)</p>
            <p class="card-number">{{ counts.classrooms ?? "—" }}</p>
          </div>
          <div class="card-illustration classrooms"></div>
        </div>
        <p class="card-footer">Ver aulas →</p>
      </RouterLink>

      <RouterLink class="card card-courses" to="/courses">
        <div class="card-main">
          <div>
            <p class="card-label">Cursos</p>
            <p class="card-number">{{ counts.courses ?? "—" }}</p>
          </div>
          <div class="card-illustration courses"></div>
        </div>
        <p class="card-footer">Ver cursos →</p>
      </RouterLink>
    </section>

    <!-- PADRES DE FAMILIA -->
    <section class="parents">
      <div class="parents-head">
        <h2>👨‍👩‍👧‍👦 Padres de familia — ¿A quiénes matriculó?</h2>
        <p class="parents-sub">
          Filtra por apoderado para ver las matrículas de todos sus hijos.
        </p>

        <div class="filters">
          <input
            v-model="parentQuery"
            class="input"
            type="text"
            placeholder="Buscar apoderado por nombre o teléfono…"
            @input="filterParents"
          />

          <select
            v-model="selectedParentKey"
            class="input"
            @change="loadParentEnrollments"
          >
            <option value="">Seleccione apoderado…</option>
            <option v-for="p in filteredParents" :key="p.key" :value="p.key">
              {{ p.guardian_name }} — {{ p.guardian_phone || "sin teléfono" }}
            </option>
          </select>

          <button class="btn small" @click="loadParentEnrollments">
            🔎 Ver
          </button>
        </div>
      </div>

      <div v-if="parentLoading" class="status">
        ⏳ Buscando matrículas del apoderado…
      </div>
      <div v-else-if="parentRows.length === 0" class="status">
        No hay matrículas para mostrar.
      </div>

      <ul v-else class="list">
        <li v-for="r in parentRows" :key="r.id" class="row">
          <div class="row-main">
            <strong>#{{ r.id }}</strong>
            <span>{{ r.student }}</span>
            <span class="muted">{{ r.dni || "—" }}</span>
          </div>
          <div class="row-info">
            <span>🗓️ {{ r.year }}</span>
            <span>🏫 {{ r.grade }}° {{ r.section }}</span>
            <span class="pill" :data-status="r.status">{{ r.status }}</span>
            <span>📅 {{ r.date }}</span>
          </div>
        </li>
      </ul>
    </section>

    <!-- REPORTE MATRÍCULA POR GRADO / SECCIÓN -->
    <section class="report">
      <div class="report-head">
        <div class="report-head-main">
          <div>
            <h2>📊 Reporte de matriculados por grado y sección</h2>
            <p class="report-sub">
              Total de estudiantes y listado por aula en cada año académico.
            </p>
          </div>

          <div class="filters">
            <label class="text-xs text-zinc-300 flex items-center gap-2">
              Año:
              <select
                v-model="reportYearFilter"
                class="input input-sm"
                @change="loadReport"
              >
                <option value="">Todos</option>
                <option
                  v-for="y in reportYears"
                  :key="y.id"
                  :value="y.id"
                >
                  {{ y.year_label }}
                </option>
              </select>
            </label>

            <button
              class="btn small"
              type="button"
              @click="downloadReportPdf"
              :disabled="!reportRows.length"
            >
              ⬇ Descargar PDF
            </button>
          </div>
        </div>
      </div>

      <div v-if="reportLoading" class="status">
        ⏳ Generando reporte…
      </div>

      <div v-else-if="reportRows.length === 0" class="status">
        No hay matrículas para el filtro seleccionado.
      </div>

      <div v-else class="report-table-wrapper">
        <table class="report-table">
          <thead>
            <tr>
              <th>Año</th>
              <th>Grado / Sección</th>
              <th class="text-right">Total matriculados</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="r in reportRows" :key="`${r.year}-${r.grade}-${r.section}`">
              <!-- Fila resumen -->
              <tr>
                <td>{{ r.year }}</td>
                <td>{{ r.grade }}° {{ r.section }}</td>
                <td class="text-right">{{ r.total }}</td>
              </tr>
              <!-- Fila detalle de estudiantes -->
              <tr>
                <td colspan="3">
                  <ul class="students-list">
                    <li
                      v-for="s in r.students"
                      :key="s.enrollment_id"
                      class="students-item"
                    >
                      <div class="students-main">
                        <span class="students-name">{{ s.student_name }}</span>
                        <span class="students-dni">DNI: {{ s.dni || "—" }}</span>
                      </div>
                      <div class="students-extra">
                        <span class="pill" :data-status="s.status">
                          {{ s.status }}
                        </span>
                        <span class="students-date">
                          📅 {{ s.enrolled_at }}
                        </span>
                      </div>
                    </li>
                  </ul>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ACCESOS RÁPIDOS -->
    <nav class="links">
      <RouterLink class="btn ghost" to="/enrrollments">📝 Matrículas</RouterLink>
      <RouterLink class="btn ghost" to="/students">👩‍🎓 Estudiantes</RouterLink>
      <RouterLink class="btn ghost" to="/teachers">👩‍🏫 Docentes</RouterLink>
      <RouterLink class="btn ghost" to="/classrooms">🏫 Aulas</RouterLink>
      <RouterLink class="btn ghost" to="/courses">📚 Cursos</RouterLink>
      <RouterLink class="btn ghost" to="/enrrollments/reprint">
        🧾 Reimprimir matrícula
      </RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { supabase } from "@/lib/supabaseClient"
import jsPDF from "jspdf"

/* ========== MÉTRICAS ========== */

const counts = ref<{ [k: string]: number | null }>({
  enrollments: null,
  students: null,
  teachers: null,
  classrooms: null,
  courses: null,
})

async function countTable(table: string) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
  if (error) {
    console.error("❌ Error contando tabla", table, ":", error.message)
    return null
  }
  return count ?? 0
}

async function loadCounts() {
  counts.value.enrollments = await countTable("enrollments")
  counts.value.students = await countTable("students")
  counts.value.teachers = await countTable("teachers")
  counts.value.classrooms = await countTable("classrooms")
  counts.value.courses = await countTable("courses")
}

/* ========== PADRES DE FAMILIA ========== */

type ParentKey = string
type Parent = {
  key: ParentKey
  guardian_name: string
  guardian_phone: string | null
}

const allParents = ref<Parent[]>([])
const filteredParents = ref<Parent[]>([])
const parentQuery = ref("")
const selectedParentKey = ref<ParentKey>("")

const parentLoading = ref(false)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parentRows = ref<any[]>([])

function makeKey(name: string, phone: string | null) {
  return `${(name || "").trim()}||${(phone || "").trim()}`
}

async function loadAllParents() {
  const { data, error } = await supabase
    .from("students")
    .select("guardian_name, guardian_phone")
    .not("guardian_name", "is", null)

  if (error || !data) {
    console.error("❌ Error cargando apoderados:", error?.message)
    allParents.value = []
    filteredParents.value = []
    return
  }

  const map = new Map<ParentKey, Parent>()
  for (const s of data) {
    const key = makeKey(s.guardian_name, s.guardian_phone ?? null)
    if (!map.has(key)) {
      map.set(key, {
        key,
        guardian_name: s.guardian_name,
        guardian_phone: s.guardian_phone ?? null,
      })
    }
  }
  allParents.value = Array.from(map.values())
  filteredParents.value = allParents.value
}

function filterParents() {
  const q = parentQuery.value.toLowerCase().trim()
  if (!q) {
    filteredParents.value = allParents.value
    return
  }
  filteredParents.value = allParents.value.filter(
    (p) =>
      (p.guardian_name || "").toLowerCase().includes(q) ||
      (p.guardian_phone || "").toLowerCase().includes(q),
  )
}

async function loadParentEnrollments() {
  parentRows.value = []
  if (!selectedParentKey.value) return

  parentLoading.value = true
  try {
    const [name, phone] = selectedParentKey.value.split("||")

    // 1) Hijos del apoderado
    let kidsQuery = supabase
      .from("students")
      .select("id, full_name, dni, guardian_name, guardian_phone")
      .eq("guardian_name", name)

    if (phone) {
      kidsQuery = kidsQuery.eq("guardian_phone", phone)
    } else {
      kidsQuery = kidsQuery.is("guardian_phone", null)
    }

    const { data: kids, error: kidsErr } = await kidsQuery

    if (kidsErr) {
      console.error("❌ Error cargando hijos del apoderado:", kidsErr.message)
      parentRows.value = []
      return
    }
    if (!kids || !kids.length) {
      parentRows.value = []
      return
    }

    const studentIds = kids.map((k) => k.id)

    // 2) Matrículas de esos hijos
    const { data, error } = await supabase
      .from("enrollments")
      .select(
        `
        id,
        status,
        enrolled_at,
        academic_year:academic_year_id ( year_label ),
        student:student_id ( id, full_name, dni ),
        classroom:classrooms!fk_enroll_classroom_year ( grade_level, section )
      `,
      )
      .in("student_id", studentIds)
      .order("id", { ascending: false })
      .limit(500)

    if (error) {
      console.error("❌ Error cargando matrículas del apoderado:", error.message)
      parentRows.value = []
      return
    }
    if (!data) {
      parentRows.value = []
      return
    }

    parentRows.value = data.map((e: any) => ({
      id: e.id,
      student: e?.student?.full_name ?? "—",
      dni: e?.student?.dni ?? "",
      year: e?.academic_year?.year_label ?? "—",
      grade: e?.classroom?.grade_level ?? "—",
      section: e?.classroom?.section ?? "—",
      status: e.status,
      date: (e.enrolled_at ?? "").slice(0, 10),
    }))
  } finally {
    parentLoading.value = false
  }
}

/* ========== REPORTE: MATRICULADOS POR GRADO / SECCIÓN ========== */

type ReportStudent = {
  enrollment_id: number
  student_name: string
  dni: string | null
  status: string
  enrolled_at: string
}

type ReportRow = {
  year: number | string
  grade: number
  section: string
  total: number
  students: ReportStudent[]
}

type ReportYear = { id: number; year_label: number }

const reportYears = ref<ReportYear[]>([])
const reportYearFilter = ref<number | "">("")
const reportRows = ref<ReportRow[]>([])
const reportLoading = ref(false)

async function loadReportYears() {
  const { data, error } = await supabase
    .from("academic_years")
    .select("id, year_label")
    .order("year_label", { ascending: false })

  if (!error && data) {
    reportYears.value = data as ReportYear[]
  }
}

async function loadReport() {
  reportRows.value = []
  reportLoading.value = true

  try {
    let query = supabase
      .from("enrollments")
      .select(
        `
        id,
        status,
        enrolled_at,
        academic_year:academic_year_id ( id, year_label ),
        student:student_id ( full_name, dni ),
        classroom:classrooms!fk_enroll_classroom_year ( grade_level, section )
      `,
      )

    if (reportYearFilter.value) {
      query = query.eq("academic_year_id", Number(reportYearFilter.value))
    }

    const { data, error } = await query

    if (error) {
      console.error("❌ Error cargando reporte:", error.message)
      reportRows.value = []
      return
    }

    const map = new Map<string, ReportRow>()

    for (const e of (data ?? []) as any[]) {
      const year = e.academic_year?.year_label ?? "—"
      const grade = e.classroom?.grade_level
      const section = e.classroom?.section

      if (!grade || !section) continue

      const key = `${year}-${grade}-${section}`

      if (!map.has(key)) {
        map.set(key, {
          year,
          grade,
          section,
          total: 0,
          students: [],
        })
      }

      const row = map.get(key)!
      row.total++
      row.students.push({
        enrollment_id: e.id,
        student_name: e.student?.full_name ?? "—",
        dni: e.student?.dni ?? null,
        status: e.status,
        enrolled_at: (e.enrolled_at ?? "").slice(0, 10),
      })
    }

    reportRows.value = Array.from(map.values()).sort((a, b) => {
      if (a.year === b.year) {
        if (a.grade === b.grade) {
          return a.section.localeCompare(b.section)
        }
        return a.grade - b.grade
      }
      return (a.year as number) - (b.year as number)
    })
  } finally {
    reportLoading.value = false
  }
}

/* ========== PDF DEL REPORTE (CON LISTA DE ESTUDIANTES) ========== */

function downloadReportPdf() {
  if (!reportRows.value.length) {
    alert("No hay datos en el reporte para descargar.")
    return
  }

  const doc = new jsPDF()
  const title = "Reporte de matriculados por grado y sección"

  doc.setFontSize(16)
  doc.text(title, 105, 15, { align: "center" })

  doc.setFontSize(10)

  let subtitle = "Años académicos: Todos"
  if (reportYearFilter.value) {
    const yearObj = reportYears.value.find(
      (y) => y.id === Number(reportYearFilter.value),
    )
    if (yearObj) {
      subtitle = `Año académico: ${yearObj.year_label}`
    }
  }
  doc.text(subtitle, 15, 25)

  const generatedAt = new Date().toLocaleString()
  doc.text(`Generado: ${generatedAt}`, 15, 31)

  let y = 40
  const maxY = 280

  const newPageWithHeader = () => {
    doc.addPage()
    y = 20
    doc.setFontSize(12)
  }

  doc.setFontSize(12)

  for (const r of reportRows.value) {
    // Salto de página si se llena
    if (y > maxY - 20) {
      newPageWithHeader()
    }

    // Título del aula
    doc.setFont(undefined, "bold")
    doc.text(
      `Año ${r.year} — ${r.grade}° "${r.section}" (Total: ${r.total})`,
      15,
      y,
    )
    y += 6

    // Encabezado estudiantes
    doc.setFontSize(10)
    doc.setFont(undefined, "bold")
    doc.text("Estudiante", 18, y)
    doc.text("DNI", 105, y)
    doc.text("Estado", 135, y)
    doc.text("Fecha", 165, y)
    y += 5

    doc.setFont(undefined, "normal")

    for (const s of r.students) {
      if (y > maxY) {
        newPageWithHeader()
        doc.setFont(undefined, "bold")
        doc.text(
          `Año ${r.year} — ${r.grade}° "${r.section}" (cont.)`,
          15,
          y,
        )
        y += 6
        doc.text("Estudiante", 18, y)
        doc.text("DNI", 105, y)
        doc.text("Estado", 135, y)
        doc.text("Fecha", 165, y)
        y += 5
        doc.setFont(undefined, "normal")
      }

      doc.text(s.student_name, 18, y)
      doc.text(s.dni || "-", 105, y)
      doc.text(s.status, 135, y)
      doc.text(s.enrolled_at || "", 165, y)
      y += 5
    }

    y += 4
  }

  doc.setFontSize(8)
  doc.text(
    "Este reporte fue generado automáticamente por el sistema de matrículas.",
    15,
    290,
  )

  const fileSuffix = reportYearFilter.value
    ? `_year_${reportYears.value.find((y) => y.id === Number(reportYearFilter.value))?.year_label}`
    : `_all_years`

  const fileName = `reporte_matriculas_detalle${fileSuffix}.pdf`
  doc.save(fileName)
}

/* ========== INIT ========== */

onMounted(async () => {
  await loadCounts()
  await loadAllParents()
  await loadReportYears()
  await loadReport()
})
</script>

<style scoped>
.dashboard {
  display: grid;
  gap: 1.5rem;
  padding: 1.5rem 1.75rem 2rem;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}
.title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
}
.subtitle {
  margin-top: 0.15rem;
  font-size: 0.9rem;
  color: #9ca3af;
}

/* Cards métricas */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
}
.card {
  position: relative;
  border-radius: 1rem;
  padding: 1rem 1.1rem;
  border: 1px solid #ffffff18;
  text-decoration: none;
  background: radial-gradient(circle at top left, #1d3557, #020617);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.35);
  transition: transform 0.12s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}
.card-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}
.card-label {
  font-size: 0.9rem;
  color: #e5e7eb;
  margin-bottom: 0.2rem;
}
.card-number {
  font-size: 2rem;
  font-weight: 700;
}
.card-footer {
  margin-top: 0.6rem;
  font-size: 0.8rem;
  color: #9ca3af;
}
.card:hover {
  transform: translateY(-2px);
  border-color: #38bdf8;
  box-shadow: 0 18px 40px rgba(56, 189, 248, 0.27);
}

/* “Imagen” circular */
.card-illustration {
  width: 60px;
  height: 60px;
  border-radius: 999px;
  background-size: cover;
  background-position: center;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.5);
}
.card-illustration.enrollments {
  background-image: url("https://images.pexels.com/photos/8422147/pexels-photo-8422147.jpeg?auto=compress&cs=tinysrgb&w=200");
}
.card-illustration.students {
  background-image: url("https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=200");
}
.card-illustration.teachers {
  background-image: url("https://images.pexels.com/photos/5212337/pexels-photo-5212337.jpeg?auto=compress&cs=tinysrgb&w=200");
}
.card-illustration.classrooms {
  background-image: url("https://images.pexels.com/photos/3184328/pexels-photo-3184328.jpeg?auto=compress&cs=tinysrgb&w=200");
}
.card-illustration.courses {
  background-image: url("https://images.pexels.com/photos/4144222/pexels-photo-4144222.jpeg?auto=compress&cs=tinysrgb&w=200");
}

/* Padres */
.parents {
  display: grid;
  gap: 0.8rem;
  border-radius: 1rem;
  border: 1px solid #ffffff18;
  padding: 1rem 1.1rem;
  background: linear-gradient(135deg, #020617, #020617, #111827);
}
.parents-head {
  display: grid;
  gap: 0.4rem;
}
.parents-head h2 {
  font-size: 1rem;
  font-weight: 600;
}
.parents-sub {
  font-size: 0.85rem;
  color: #9ca3af;
}
.filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.input {
  background: #020617;
  border: 1px solid #ffffff22;
  border-radius: 0.6rem;
  padding: 0.45rem 0.65rem;
  color: #fff;
  min-width: 230px;
  font-size: 0.85rem;
}
.input-sm {
  min-width: 150px;
}

.status {
  padding: 0.75rem 1rem;
  border: 1px dashed #ffffff33;
  border-radius: 0.7rem;
  font-size: 0.9rem;
}

/* lista de matrículas del padre */
.list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 0.55rem;
}
.row {
  border: 1px solid #ffffff18;
  border-radius: 0.75rem;
  padding: 0.65rem 0.8rem;
  background: #020617;
}
.row-main {
  display: flex;
  gap: 0.6rem;
  align-items: center;
}
.row-main .muted {
  opacity: 0.6;
}
.row-info {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.3rem;
  align-items: center;
  font-size: 0.86rem;
}
.pill {
  padding: 0.15rem 0.5rem;
  border-radius: 0.6rem;
  font-size: 0.8rem;
  border: 1px solid #ffffff22;
  text-transform: capitalize;
}
.pill[data-status="active"] {
  border-color: #16a34a;
}
.pill[data-status="withdrawn"] {
  border-color: #eab308;
}
.pill[data-status="transferred"] {
  border-color: #38bdf8;
}

/* REPORTE */
.report {
  display: grid;
  gap: 0.8rem;
  border-radius: 1rem;
  border: 1px solid #ffffff18;
  padding: 1rem 1.1rem;
  background: #020617;
}
.report-head-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.report-sub {
  font-size: 0.85rem;
  color: #
9ca3af;
}
.report-table-wrapper {
  overflow-x: auto;
}
.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.report-table th,
.report-table td {
  padding: 0.45rem 0.6rem;
  border-bottom: 1px solid #27272f;
}
.report-table th {
  text-align: left;
  font-weight: 600;
  color: #e5e7eb;
  background: #020617;
}
.report-table tbody tr:nth-child(even) {
  background: #020617;
}
.text-right {
  text-align: right;
}

/* Lista de estudiantes dentro del reporte */
.students-list {
  list-style: none;
  padding: 0.4rem 0 0;
  margin: 0;
  display: grid;
  gap: 0.35rem;
}
.students-item {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  border-radius: 0.45rem;
  padding: 0.35rem 0.5rem;
  background: #020617;
  border: 1px solid #27272f;
}
.students-main {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.students-name {
  font-weight: 500;
}
.students-dni {
  font-size: 0.8rem;
  color: #9ca3af;
}
.students-extra {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.8rem;
}
.students-date {
  color: #9ca3af;
}

/* Links finales */
.links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.75rem;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.75rem 1rem;
  border-radius: 0.7rem;
  border: 1px solid #ffffff22;
  text-decoration: none;
  font-weight: 600;
  background: #1f2937;
  transition: transform 0.12s ease, background 0.2s ease, border-color 0.2s ease;
  font-size: 0.9rem;
}
.btn:hover {
  transform: translateY(-1px);
  background: #273447;
}
.btn.solid {
  background: #16a34a;
  border-color: #22c55e;
  color: #f9fafb;
}
.btn.solid:hover {
  background: #15803d;
}
.btn.ghost {
  background: transparent;
}
.btn.small {
  padding-inline: 0.85rem;
  padding-block: 0.45rem;
  font-size: 0.85rem;
}
.badge-new {
  font-size: 0.75rem;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: #0f172a;
  border: 1px solid #bbf7d0;
  color: #bbf7d0;
}
</style>
