<template>
  <div class="p-6 space-y-6">
    <!-- CABECERA -->
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold flex items-center gap-2">
          🧾 Reimprimir matrícula
        </h1>
        <p class="text-xs text-zinc-400">
          Busca por DNI del estudiante y vuelve a descargar las fichas de matrícula ya registradas.
        </p>
      </div>

      <RouterLink class="text-sm text-blue-400 hover:underline" to="/">
        ⬅ Volver al Panel
      </RouterLink>
    </header>

    <!-- BUSCADOR POR DNI -->
    <section class="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4 space-y-4">
      <form class="flex flex-col md:flex-row gap-3 items-start md:items-end" @submit.prevent="onSearch">
        <div class="flex-1 w-full">
          <label class="text-sm text-zinc-200">DNI del estudiante</label>
          <input
            v-model="dni"
            type="text"
            maxlength="12"
            class="input"
            placeholder="Ingresa el DNI del estudiante"
            required
          />
        </div>

        <Button type="submit" :disabled="loadingSearch">
          <span v-if="loadingSearch">Buscando…</span>
          <span v-else>Buscar matrículas</span>
        </Button>
      </form>

      <p v-if="errorMessage" class="text-sm text-red-400">
        {{ errorMessage }}
      </p>
    </section>

    <!-- RESULTADO: DATOS DEL ESTUDIANTE -->
    <section
      v-if="student"
      class="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4 space-y-2"
    >
      <h2 class="text-sm font-semibold text-zinc-200 flex items-center gap-2">
        👩‍🎓 Estudiante encontrado
      </h2>
      <p class="text-sm">
        <span class="font-medium">{{ student.full_name }}</span>
        <span class="text-zinc-400"> — DNI: {{ student.dni || "—" }}</span>
      </p>
      <p class="text-xs text-zinc-400">
        Apoderado: {{ student.guardian_name || "—" }} · Teléfono:
        {{ student.guardian_phone || "—" }}
      </p>
    </section>

    <!-- LISTA DE MATRÍCULAS -->
    <section
      v-if="student"
      class="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4 space-y-3"
    >
      <h2 class="text-sm font-semibold text-zinc-200 flex items-center gap-2">
        📑 Matrículas registradas
      </h2>

      <div v-if="loadingEnrollments" class="text-sm text-zinc-400">
        ⏳ Cargando matrículas…
      </div>

      <div v-else-if="rows.length === 0" class="text-sm text-zinc-400">
        No hay matrículas registradas para este estudiante.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-zinc-700 text-zinc-300">
              <th class="py-2 text-left">N°</th>
              <th class="py-2 text-left">Año académico</th>
              <th class="py-2 text-left">Grado / Sección</th>
              <th class="py-2 text-left">Estado</th>
              <th class="py-2 text-left">Fecha matrícula</th>
              <th class="py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="e in rows"
              :key="e.id"
              class="border-b border-zinc-800 hover:bg-zinc-900/60"
            >
              <td class="py-2">#{{ e.id }}</td>
              <td class="py-2">{{ e.academic_year?.year_label || "—" }}</td>
              <td class="py-2">
                {{ e.classroom?.grade_level || "—" }}° {{ e.classroom?.section || "—" }}
              </td>
              <td class="py-2 capitalize">
                {{ e.status }}
              </td>
              <td class="py-2">{{ (e.enrolled_at || "").slice(0, 10) }}</td>
              <td class="py-2 text-right">
                <Button size="sm" variant="outline" @click="onReprint(e)">
                  Imprimir PDF
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import jsPDF from "jspdf"

type Student = {
  id: number
  full_name: string
  dni: string | null
  birth_date: string | null
  guardian_name: string | null
  guardian_phone: string | null
}

type EnrollmentRow = {
  id: number
  status: string
  enrolled_at: string | null
  academic_year: { year_label: number } | null
  classroom: { grade_level: number; section: string } | null
  student: Student
}

const dni = ref("")
const student = ref<Student | null>(null)
const rows = ref<EnrollmentRow[]>([])
const loadingSearch = ref(false)
const loadingEnrollments = ref(false)
const errorMessage = ref("")

/* --- Generar PDF reutilizando la lógica de new.vue --- */
function generateEnrollmentPdf(e: EnrollmentRow) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text("Ficha de Matrícula", 105, 15, { align: "center" })

  doc.setFontSize(11)
  doc.text(`N° Matrícula: ${e.id}`, 15, 30)
  doc.text(`Fecha matrícula: ${e.enrolled_at?.slice(0, 10) || ""}`, 120, 30)

  doc.setFontSize(13)
  doc.text("Datos del estudiante", 15, 45)
  doc.setFontSize(11)
  doc.text(`Nombre completo: ${e.student.full_name || ""}`, 15, 53)
  doc.text(`DNI: ${e.student.dni || "-"}`, 15, 60)
  doc.text(`Fecha de nacimiento: ${e.student.birth_date || "-"}`, 15, 67)

  doc.setFontSize(13)
  doc.text("Datos del apoderado", 15, 82)
  doc.setFontSize(11)
  doc.text(`Nombre: ${e.student.guardian_name || ""}`, 15, 90)
  doc.text(`Teléfono: ${e.student.guardian_phone || ""}`, 15, 97)

  doc.setFontSize(13)
  doc.text("Detalle de matrícula", 15, 112)
  doc.setFontSize(11)
  doc.text(
    `Año académico: ${e.academic_year?.year_label || "-"}`,
    15,
    120
  )
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

  const fileName = `matricula_${e.student.dni || e.student.full_name || e.id}.pdf`
  doc.save(fileName)
}

/* --- Buscar estudiante por DNI y cargar matrículas --- */
async function onSearch() {
  errorMessage.value = ""
  student.value = null
  rows.value = []

  const dniTrim = dni.value.trim()
  if (!dniTrim) {
    errorMessage.value = "Ingresa un DNI para buscar."
    return
  }

  loadingSearch.value = true
  try {
    const { data, error } = await supabase
      .from("students")
      .select("id, full_name, dni, birth_date, guardian_name, guardian_phone")
      .eq("dni", dniTrim)
      .maybeSingle()

    if (error) {
      console.error("Error buscando estudiante:", error.message)
      errorMessage.value = "No se pudo buscar el estudiante."
      return
    }

    if (!data) {
      errorMessage.value = "No se encontró ningún estudiante con ese DNI."
      return
    }

    student.value = data as Student
    await loadEnrollmentsForStudent(data.id)
  } finally {
    loadingSearch.value = false
  }
}

async function loadEnrollmentsForStudent(studentId: number) {
  loadingEnrollments.value = true
  rows.value = []
  try {
    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        id,
        status,
        enrolled_at,
        academic_year:academic_year_id ( year_label ),
        classroom:classrooms!fk_enroll_classroom_year ( grade_level, section )
      `)
      .eq("student_id", studentId)
      .order("enrolled_at", { ascending: false })

    if (error) {
      console.error("Error cargando matrículas:", error.message)
      errorMessage.value = "No se pudieron cargar las matrículas."
      return
    }

    const s = student.value!
    rows.value = (data ?? []).map((e: any) => ({
      id: e.id,
      status: e.status,
      enrolled_at: e.enrolled_at,
      academic_year: e.academic_year ?? null,
      classroom: e.classroom ?? null,
      student: s,
    }))
  } finally {
    loadingEnrollments.value = false
  }
}

function onReprint(row: EnrollmentRow) {
  generateEnrollmentPdf(row)
}
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
