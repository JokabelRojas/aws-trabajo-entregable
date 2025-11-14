<template>
  <div class="p-6 space-y-6">
    <!-- CABECERA -->
    <header class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span
          class="text-[10px] px-2 py-[2px] rounded-full border border-emerald-400/60 text-emerald-300 bg-emerald-500/10"
        >
          NEW
        </span>
        <div>
          <h1 class="text-xl font-semibold flex items-center gap-2">
            Nueva matrícula
          </h1>
          <p class="text-xs text-zinc-400">
            Registra un nuevo estudiante o reutiliza sus datos si ya existe por DNI.
          </p>
        </div>
      </div>

      <RouterLink class="text-sm text-blue-400 hover:underline" to="/enrrollments">
        ⬅ Volver a Matrículas
      </RouterLink>
    </header>

    <!-- CONTENIDO EN DOS COLUMNAS -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- FICHA DEL ESTUDIANTE -->
      <section class="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4 space-y-4">
        <h2 class="text-lg font-semibold flex items-center gap-2">
          👩‍🎓 Datos del estudiante
        </h2>

        <form class="space-y-4" @submit.prevent>
          <div class="grid gap-3 md:grid-cols-2">
            <div class="grid gap-1">
              <label class="text-sm text-zinc-200">DNI</label>
              <input
                v-model="form.student_dni"
                type="text"
                maxlength="12"
                class="input"
                placeholder="Opcional, 8 dígitos"
              />
            </div>
            <div class="grid gap-1">
              <label class="text-sm text-zinc-200">Fecha de nacimiento</label>
              <div class="relative">
                <input
                  v-model="form.student_birth_date"
                  type="text"
                  class="input cursor-pointer"
                  placeholder="Seleccionar fecha"
                  readonly
                  @click="showBirthDateCalendar = !showBirthDateCalendar"
                />
                <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400">
                  📅
                </span>

                <!-- Calendario para fecha de nacimiento -->
                <div
                  v-if="showBirthDateCalendar"
                  class="absolute z-10 mt-1 bg-zinc-800 border border-zinc-600 rounded-lg shadow-lg p-3 w-64"
                >
                  <div class="flex justify-between items-center mb-2">
                    <button
                      @click="prevBirthMonth"
                      class="p-1 hover:bg-zinc-700 rounded"
                    >
                      ‹
                    </button>
                    <div class="flex items-center gap-2">
                      <select
                        v-model="birthDateCurrentMonth"
                        class="bg-zinc-700 border border-zinc-600 rounded px-1 text-sm"
                        @change="refreshBirthDateCalendar"
                      >
                        <option v-for="(month, index) in months" :key="index" :value="index">
                          {{ month }}
                        </option>
                      </select>
                      <select
                        v-model="birthDateCurrentYear"
                        class="bg-zinc-700 border border-zinc-600 rounded px-1 text-sm"
                        @change="refreshBirthDateCalendar"
                      >
                        <option v-for="year in birthDateYears" :key="year" :value="year">
                          {{ year }}
                        </option>
                      </select>
                    </div>
                    <button
                      @click="nextBirthMonth"
                      class="p-1 hover:bg-zinc-700 rounded"
                    >
                      ›
                    </button>
                  </div>
                  <div class="grid grid-cols-7 gap-1 text-xs">
                    <div v-for="day in ['L', 'M', 'M', 'J', 'V', 'S', 'D']"
                         :key="day"
                         class="text-center text-zinc-400 py-1">
                      {{ day }}
                    </div>
                    <div
                      v-for="day in birthDateCalendar.days"
                      :key="day.date"
                      @click="selectBirthDate(day.date)"
                      :class="[
                        'text-center py-1 rounded cursor-pointer hover:bg-blue-500 hover:text-white',
                        day.isCurrentMonth ? 'text-white' : 'text-zinc-500',
                        day.isToday ? 'bg-blue-600 text-white' : '',
                        day.date === form.student_birth_date ? 'bg-green-600 text-white' : '',
                        isFutureDate(day.date) ? 'opacity-50 cursor-not-allowed' : ''
                      ]"
                      :title="isFutureDate(day.date) ? 'Fecha futura no permitida' : ''"
                    >
                      {{ day.day }}
                    </div>
                  </div>
                  <button
                    @click="clearBirthDate"
                    class="w-full mt-2 text-xs text-zinc-400 hover:text-white py-1 border border-zinc-600 rounded"
                  >
                    Limpiar fecha
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="grid gap-1">
            <label class="text-sm text-zinc-200">Nombre completo *</label>
            <input
              v-model="form.student_full_name"
              type="text"
              class="input"
              required
              placeholder="Nombre y apellidos del estudiante"
            />
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            <div class="grid gap-1">
              <label class="text-sm text-zinc-200">Nombre del apoderado *</label>
              <input
                v-model="form.guardian_name"
                type="text"
                class="input"
                required
                placeholder="Padre, madre o tutor"
              />
            </div>
            <div class="grid gap-1">
              <label class="text-sm text-zinc-200">Teléfono del apoderado *</label>
              <input
                v-model="form.guardian_phone"
                type="text"
                class="input"
                required
                placeholder="9 dígitos"
              />
            </div>
          </div>

          <p class="text-xs text-zinc-400">
            Si el DNI ya existe, se reutiliza el estudiante y se actualizan sus datos
            (apoderado y teléfono) si cambiaron.
          </p>
        </form>
      </section>

      <!-- DATOS DE MATRÍCULA -->
      <section class="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4 space-y-4">
        <h2 class="text-lg font-semibold flex items-center gap-2">
          📑 Datos de matrícula
        </h2>

        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="grid gap-3 md:grid-cols-2">
            <div class="grid gap-1">
              <label class="text-sm text-zinc-200">Año académico *</label>
              <select
                v-model="form.academic_year_id"
                class="input"
                required
                @change="onYearChange"
              >
                <option value="">Seleccione año…</option>
                <option
                  v-for="y in academicYears"
                  :key="y.id"
                  :value="y.id"
                >
                  {{ y.year_label }}
                </option>
              </select>
            </div>

            <div class="grid gap-1">
              <label class="text-sm text-zinc-200">Estado *</label>
              <select v-model="form.status" class="input" required>
                <option value="active">active</option>
                <option value="withdrawn">withdrawn</option>
                <option value="transferred">transferred</option>
              </select>
            </div>
          </div>

          <div class="grid gap-1">
            <label class="text-sm text-zinc-200">Aula (grado y sección) *</label>
            <select
              v-model="form.classroom_id"
              class="input"
              :disabled="!classrooms.length"
              required
            >
              <option value="">Seleccione aula…</option>
              <option
                v-for="c in classrooms"
                :key="c.id"
                :value="c.id"
              >
                {{ c.grade_level }}° {{ c.section }} — {{ c.year_label }}
              </option>
            </select>
            <p v-if="!form.academic_year_id" class="text-xs text-zinc-400">
              Primero selecciona un año académico para ver las aulas disponibles.
            </p>
          </div>

          <div class="grid gap-1">
            <label class="text-sm text-zinc-200">Fecha de matrícula *</label>
            <div class="relative">
              <input
                v-model="form.enrolled_at"
                type="text"
                class="input cursor-pointer"
                placeholder="Seleccionar fecha"
                readonly
                @click="showEnrollmentCalendar = !showEnrollmentCalendar"
              />
              <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400">
                📅
              </span>

              <!-- Calendario para fecha de matrícula -->
              <div
                v-if="showEnrollmentCalendar"
                class="absolute z-10 mt-1 bg-zinc-800 border border-zinc-600 rounded-lg shadow-lg p-3 w-64"
              >
                <div class="flex justify-between items-center mb-2">
                  <button
                    @click="prevEnrollmentMonth"
                    class="p-1 hover:bg-zinc-700 rounded"
                  >
                    ‹
                  </button>
                  <div class="flex items-center gap-2">
                    <select
                      v-model="enrollmentDateCurrentMonth"
                      class="bg-zinc-700 border border-zinc-600 rounded px-1 text-sm"
                      @change="refreshEnrollmentCalendar"
                    >
                      <option v-for="(month, index) in months" :key="index" :value="index">
                        {{ month }}
                      </option>
                    </select>
                    <select
                      v-model="enrollmentDateCurrentYear"
                      class="bg-zinc-700 border border-zinc-600 rounded px-1 text-sm"
                      @change="refreshEnrollmentCalendar"
                    >
                      <option v-for="year in enrollmentDateYears" :key="year" :value="year">
                        {{ year }}
                      </option>
                    </select>
                  </div>
                  <button
                    @click="nextEnrollmentMonth"
                    class="p-1 hover:bg-zinc-700 rounded"
                  >
                    ›
                  </button>
                </div>
                <div class="grid grid-cols-7 gap-1 text-xs">
                  <div v-for="day in ['L', 'M', 'M', 'J', 'V', 'S', 'D']"
                       :key="day"
                       class="text-center text-zinc-400 py-1">
                    {{ day }}
                  </div>
                  <div
                    v-for="day in enrollmentCalendar.days"
                    :key="day.date"
                    @click="selectEnrollmentDate(day.date)"
                    :class="[
                      'text-center py-1 rounded cursor-pointer hover:bg-blue-500 hover:text-white',
                      day.isCurrentMonth ? 'text-white' : 'text-zinc-500',
                      day.isToday ? 'bg-blue-600 text-white' : '',
                      day.date === form.enrolled_at ? 'bg-green-600 text-white' : ''
                    ]"
                  >
                    {{ day.day }}
                  </div>
                </div>
                <button
                  @click="setTodayEnrollmentDate"
                  class="w-full mt-2 text-xs text-blue-400 hover:text-blue-300 py-1 border border-blue-500 rounded"
                >
                  Usar fecha actual
                </button>
              </div>
            </div>
          </div>

          <!-- ERRORES DE VALIDACIÓN -->
          <div
            v-if="formErrors.length"
            class="mb-2 rounded-md border border-red-500/60 bg-red-500/10 p-2 text-xs text-red-300 space-y-1"
          >
            <p class="font-semibold">Por favor corrige lo siguiente:</p>
            <ul class="list-disc list-inside">
              <li v-for="msg in formErrors" :key="msg">{{ msg }}</li>
            </ul>
          </div>

          <div v-if="errorMessage" class="text-sm text-red-400">
            {{ errorMessage }}
          </div>
          <div v-if="successMessage" class="text-sm text-emerald-400">
            {{ successMessage }}
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" @click="resetForm">
              Limpiar
            </Button>
            <Button type="submit" :disabled="saving">
              <span v-if="saving">Guardando…</span>
              <span v-else>Guardar matrícula</span>
            </Button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { useRouter } from "vue-router"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import jsPDF from "jspdf"

type AcademicYear = { id: number; year_label: number }
type Classroom = {
  id: number
  academic_year_id: number
  year_label: number
  grade_level: number
  section: string
}

const router = useRouter()

const academicYears = ref<AcademicYear[]>([])
const classrooms = ref<Classroom[]>([])

const saving = ref(false)
const errorMessage = ref("")
const successMessage = ref("")
const formErrors = ref<string[]>([])

// Estados para los calendarios
const showBirthDateCalendar = ref(false)
const showEnrollmentCalendar = ref(false)
const birthDateCurrentMonth = ref(new Date().getMonth())
const birthDateCurrentYear = ref(new Date().getFullYear())
const enrollmentDateCurrentMonth = ref(new Date().getMonth())
const enrollmentDateCurrentYear = ref(new Date().getFullYear())

const today = new Date().toISOString().slice(0, 10)

const form = ref({
  student_dni: "",
  student_full_name: "",
  student_birth_date: "",
  guardian_name: "",
  guardian_phone: "",
  academic_year_id: "" as number | "" | null,
  classroom_id: "" as number | "" | null,
  status: "active",
  enrolled_at: today,
})

// Lista de meses en español
const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

// Rango de años para fecha de nacimiento (desde 1990 hasta actual + 1)
const birthDateYears = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let year = 1990; year <= currentYear + 1; year++) {
    years.push(year)
  }
  return years
})

// Rango de años para fecha de matrícula (actual -1 hasta actual + 2)
const enrollmentDateYears = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let year = currentYear - 1; year <= currentYear + 2; year++) {
    years.push(year)
  }
  return years
})

// Calendario para fecha de nacimiento
const birthDateCalendar = computed(() => {
  return generateCalendar(birthDateCurrentYear.value, birthDateCurrentMonth.value)
})

// Calendario para fecha de matrícula
const enrollmentCalendar = computed(() => {
  return generateCalendar(enrollmentDateCurrentYear.value, enrollmentDateCurrentMonth.value)
})

// Función para verificar si una fecha es futura
function isFutureDate(date: string): boolean {
  return new Date(date) > new Date()
}

// Función para generar el calendario
function generateCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1 // Ajuste para empezar en lunes

  const days = []

  // Días del mes anterior
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startingDay - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i)
    days.push({
      day: prevMonthLastDay - i,
      date: date.toISOString().slice(0, 10),
      isCurrentMonth: false,
      isToday: false
    })
  }

  // Días del mes actual
  const today = new Date().toISOString().slice(0, 10)
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i).toISOString().slice(0, 10)
    days.push({
      day: i,
      date: date,
      isCurrentMonth: true,
      isToday: date === today
    })
  }

  // Días del siguiente mes
  const totalCells = 42 // 6 semanas
  const remainingDays = totalCells - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i).toISOString().slice(0, 10)
    days.push({
      day: i,
      date: date,
      isCurrentMonth: false,
      isToday: false
    })
  }

  return { days }
}

// Navegación de meses para fecha de nacimiento
function prevBirthMonth() {
  if (birthDateCurrentMonth.value === 0) {
    birthDateCurrentMonth.value = 11
    birthDateCurrentYear.value--
  } else {
    birthDateCurrentMonth.value--
  }
}

function nextBirthMonth() {
  if (birthDateCurrentMonth.value === 11) {
    birthDateCurrentMonth.value = 0
    birthDateCurrentYear.value++
  } else {
    birthDateCurrentMonth.value++
  }
}

// Navegación de meses para fecha de matrícula
function prevEnrollmentMonth() {
  if (enrollmentDateCurrentMonth.value === 0) {
    enrollmentDateCurrentMonth.value = 11
    enrollmentDateCurrentYear.value--
  } else {
    enrollmentDateCurrentMonth.value--
  }
}

function nextEnrollmentMonth() {
  if (enrollmentDateCurrentMonth.value === 11) {
    enrollmentDateCurrentMonth.value = 0
    enrollmentDateCurrentYear.value++
  } else {
    enrollmentDateCurrentMonth.value++
  }
}

// Funciones para refrescar calendarios cuando cambian los selects
function refreshBirthDateCalendar() {
  // Solo actualiza el calendario, no necesita hacer nada más
}

function refreshEnrollmentCalendar() {
  // Solo actualiza el calendario, no necesita hacer nada más
}

// Selección de fechas
function selectBirthDate(date: string) {
  if (!isFutureDate(date)) {
    form.value.student_birth_date = date
    showBirthDateCalendar.value = false
  }
}

function selectEnrollmentDate(date: string) {
  form.value.enrolled_at = date
  showEnrollmentCalendar.value = false
}

function clearBirthDate() {
  form.value.student_birth_date = ""
  showBirthDateCalendar.value = false
}

function setTodayEnrollmentDate() {
  form.value.enrolled_at = today
  showEnrollmentCalendar.value = false
}

function resetForm() {
  form.value = {
    student_dni: "",
    student_full_name: "",
    student_birth_date: "",
    guardian_name: "",
    guardian_phone: "",
    academic_year_id: "",
    classroom_id: "",
    status: "active",
    enrolled_at: today,
  }
  errorMessage.value = ""
  successMessage.value = ""
  formErrors.value = []
  classrooms.value = []
  showBirthDateCalendar.value = false
  showEnrollmentCalendar.value = false

  // Resetear a fecha actual
  const now = new Date()
  birthDateCurrentMonth.value = now.getMonth()
  birthDateCurrentYear.value = now.getFullYear()
  enrollmentDateCurrentMonth.value = now.getMonth()
  enrollmentDateCurrentYear.value = now.getFullYear()
}

async function loadAcademicYears() {
  const { data, error } = await supabase
    .from("academic_years")
    .select("id, year_label")
    .order("year_label", { ascending: false })
  if (!error && data) {
    academicYears.value = data
  }
}

async function loadClassroomsByYear(yearId: number) {
  const { data, error } = await supabase
    .from("classrooms")
    .select(`
      id,
      academic_year_id,
      grade_level,
      section,
      academic_year:academic_year_id ( year_label )
    `)
    .eq("academic_year_id", yearId)
    .order("grade_level", { ascending: true })
    .order("section", { ascending: true })

  if (error) {
    console.error("Error cargando aulas:", error.message)
    classrooms.value = []
    return
  }

  classrooms.value = (data ?? []).map((c: any) => ({
    id: c.id,
    academic_year_id: c.academic_year_id,
    year_label: c.academic_year?.year_label ?? 0,
    grade_level: c.grade_level,
    section: c.section,
  }))
}

function onYearChange() {
  classrooms.value = []
  form.value.classroom_id = ""
  if (form.value.academic_year_id) {
    loadClassroomsByYear(Number(form.value.academic_year_id))
  }
}

/* ---------- VALIDACIÓN FRONTEND ---------- */
function validateForm(): boolean {
  const errors: string[] = []

  if (!form.value.student_full_name.trim()) {
    errors.push("El nombre del estudiante es obligatorio.")
  }

  if (!form.value.guardian_name.trim()) {
    errors.push("El nombre del apoderado es obligatorio.")
  }

  if (!form.value.guardian_phone.trim()) {
    errors.push("El teléfono del apoderado es obligatorio.")
  } else if (!/^\d{9}$/.test(form.value.guardian_phone.trim())) {
    errors.push("El teléfono del apoderado debe tener 9 dígitos numéricos.")
  }

  if (form.value.student_dni.trim() && !/^\d{8}$/.test(form.value.student_dni.trim())) {
    errors.push("Si se indica DNI, debe tener exactamente 8 dígitos.")
  }

  if (form.value.student_birth_date && isFutureDate(form.value.student_birth_date)) {
    errors.push("La fecha de nacimiento no puede ser futura.")
  }

  if (!form.value.academic_year_id) {
    errors.push("Selecciona un año académico.")
  }

  if (!form.value.classroom_id) {
    errors.push("Selecciona un aula (grado y sección).")
  }

  if (!form.value.enrolled_at) {
    errors.push("La fecha de matrícula es obligatoria.")
  }

  formErrors.value = errors
  return errors.length === 0
}

/* ---------- RESOLVER / CREAR ESTUDIANTE ---------- */
async function resolveStudentId(): Promise<number> {
  const dni = form.value.student_dni.trim()
  const full_name = form.value.student_full_name.trim()
  if (!full_name) throw new Error("El nombre del estudiante es obligatorio.")

  if (dni) {
    const { data: existing, error } = await supabase
      .from("students")
      .select("id")
      .eq("dni", dni)
      .maybeSingle()

    if (error) {
      console.error("Error buscando estudiante por DNI:", error.message)
    }

    if (existing?.id) {
      await supabase
        .from("students")
        .update({
          full_name,
          birth_date: form.value.student_birth_date || null,
          guardian_name: form.value.guardian_name || null,
          guardian_phone: form.value.guardian_phone || null,
        })
        .eq("id", existing.id)
      return existing.id
    }
  }

  const payload = {
    dni: dni || null,
    full_name,
    birth_date: form.value.student_birth_date || null,
    guardian_name: form.value.guardian_name || null,
    guardian_phone: form.value.guardian_phone || null,
  }

  const { data, error } = await supabase
    .from("students")
    .insert(payload)
    .select("id")
    .single()

  if (error) throw new Error("No se pudo crear el estudiante: " + error.message)
  return data.id
}

/* ---------- GENERAR PDF ---------- */
function generateEnrollmentPdf(e: any) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text("Ficha de Matrícula", 105, 15, { align: "center" })

  doc.setFontSize(11)
  doc.text(`N° Matrícula: ${e.id}`, 15, 30)
  doc.text(`Fecha matrícula: ${e.enrolled_at?.slice(0, 10) || ""}`, 120, 30)

  doc.setFontSize(13)
  doc.text("Datos del estudiante", 15, 45)
  doc.setFontSize(11)
  doc.text(`Nombre completo: ${e.student?.full_name || ""}`, 15, 53)
  doc.text(`DNI: ${e.student?.dni || "-"}`, 15, 60)
  doc.text(`Fecha de nacimiento: ${e.student?.birth_date || "-"}`, 15, 67)

  doc.setFontSize(13)
  doc.text("Datos del apoderado", 15, 82)
  doc.setFontSize(11)
  doc.text(`Nombre: ${e.student?.guardian_name || ""}`, 15, 90)
  doc.text(`Teléfono: ${e.student?.guardian_phone || ""}`, 15, 97)

  doc.setFontSize(13)
  doc.text("Detalle de matrícula", 15, 112)
  doc.setFontSize(11)
  doc.text(`Año académico: ${e.academic_year?.year_label || "-"}`, 15, 120)
  doc.text(
    `Aula: ${e.classroom?.grade_level || "-"}° ${e.classroom?.section || "-"}`,
    15,
    127
  )
  doc.text(`Estado: ${e.status}`, 15, 134)

  doc.setFontSize(9)
  doc.text(
    "Este documento es un comprobante de matrícula generado por el sistema.",
    15,
    270
  )

  const fileName = `matricula_${e.student?.dni || e.student?.full_name || e.id}.pdf`
  doc.save(fileName)
}

/* ---------- SUBMIT ---------- */
async function onSubmit() {
  errorMessage.value = ""
  successMessage.value = ""
  formErrors.value = []

  if (!validateForm()) {
    errorMessage.value = "Revisa los campos marcados antes de continuar."
    return
  }

  saving.value = true
  try {
    const studentId = await resolveStudentId()

    const payload = {
      student_id: studentId,
      academic_year_id: Number(form.value.academic_year_id),
      classroom_id: Number(form.value.classroom_id),
      status: form.value.status,
      enrolled_at: form.value.enrolled_at,
    }

    const { data, error } = await supabase
      .from("enrollments")
      .insert(payload)
      .select(`
        id,
        status,
        enrolled_at,
        student:student_id (
          full_name,
          dni,
          birth_date,
          guardian_name,
          guardian_phone
        ),
        academic_year:academic_year_id ( year_label ),
        classroom:classrooms!fk_enroll_classroom_year ( grade_level, section )
      `)
      .single()

    if (error) {
      if (
        (error as any).code === "23505" ||
        error.message.includes("ux_enrollment_student_year")
      ) {
        throw new Error("Este estudiante ya está matriculado en ese año académico.")
      }
      throw error
    }

    generateEnrollmentPdf(data)

    successMessage.value = "Matrícula registrada correctamente."
    setTimeout(() => {
      router.push("/enrrollments")
    }, 800)
  } catch (e: any) {
    console.error("Error guardando matrícula:", e.message)
    errorMessage.value = e.message || "No se pudo guardar la matrícula."
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadAcademicYears()
})
</script>

<style scoped>
.input {
  background: #111;
  border: 1px solid #3f3f46;
  border-radius: 0.5rem;
  padding: 0.45rem 0.6rem;
  color: #fff;
  width: 100%;
  font-size: 0.9rem;
}
</style>
