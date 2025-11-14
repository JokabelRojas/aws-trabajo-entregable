<template>
  <div class="p-6 space-y-6">
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-semibold flex items-center gap-2">🏫 Aulas</h1>
      <RouterLink class="text-sm text-blue-400 hover:underline" to="/">
        ⬅ Volver al Dashboard
      </RouterLink>
      <div class="flex gap-2">
        <Button variant="secondary" @click="load">🔄 Recargar</Button>
        <Button @click="openCreate">➕ Nueva aula</Button>
      </div>
    </header>

    <div v-if="loading" class="text-sm text-gray-400">⏳ Cargando aulas…</div>
    <div v-else-if="rows.length === 0" class="text-sm text-gray-400">⚠️ No hay aulas.</div>

    <div v-else class="rounded-lg border border-zinc-700 bg-zinc-900/40 p-3 shadow-sm overflow-x-auto">
      <Table>
        <TableCaption>Lista de aulas por año académico</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[60px]">ID</TableHead>
            <TableHead>Año</TableHead>
            <TableHead>Grado</TableHead>
            <TableHead>Sección</TableHead>
            <TableHead>Tutor</TableHead>
            <TableHead class="text-right w-[140px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="c in rows" :key="c.id">
            <TableCell class="font-mono text-xs">#{{ c.id }}</TableCell>
            <TableCell>{{ c.year_label }}</TableCell>
            <TableCell>{{ c.grade_level }}°</TableCell>
            <TableCell>{{ c.section }}</TableCell>
            <TableCell>{{ c.homeroom_teacher_name || "—" }}</TableCell>
            <TableCell class="text-right">
              <div class="flex gap-2 justify-end">
                <Button size="icon-sm" variant="outline" @click="openEdit(c)">✏</Button>
                <Button size="icon-sm" variant="destructive" @click="onDelete(c)">🗑</Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- MODAL -->
    <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/60" @click="closeModal"></div>
      <div class="relative w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-lg">
        <h2 class="text-lg font-semibold mb-4">
          {{ isEditing ? "Editar aula" : "Nueva aula" }}
        </h2>
        <form @submit.prevent="onSubmit" class="space-y-4">
          <div class="grid gap-1 md:grid-cols-2 md:gap-4">
            <div class="grid gap-1">
              <label class="text-sm text-zinc-200">Año académico *</label>
              <select v-model="form.academic_year_id" class="input" required>
                <option value="">Seleccione…</option>
                <option v-for="y in academicYears" :key="y.id" :value="y.id">
                  {{ y.year_label }}
                </option>
              </select>
            </div>
            <div class="grid gap-1">
              <label class="text-sm text-zinc-200">Grado (1-5) *</label>
              <input v-model.number="form.grade_level" type="number" min="1" max="5" class="input" required />
            </div>
          </div>
          <div class="grid gap-1">
            <label class="text-sm text-zinc-200">Sección *</label>
            <input v-model="form.section" type="text" class="input" maxlength="5" required />
          </div>
          <div class="grid gap-1">
            <label class="text-sm text-zinc-200">Docente tutor</label>
            <select v-model="form.homeroom_teacher_id" class="input">
              <option value="">Sin tutor</option>
              <option v-for="t in teachers" :key="t.id" :value="t.id">
                {{ t.full_name }}
              </option>
            </select>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" @click="closeModal">Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { supabase } from "@/lib/supabaseClient"
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

type ClassroomRow = {
  id: number
  academic_year_id: number
  year_label: number
  grade_level: number
  section: string
  homeroom_teacher_id?: number | null
  homeroom_teacher_name?: string | null
}

const rows = ref<ClassroomRow[]>([])
const loading = ref(true)

const academicYears = ref<{ id: number; year_label: number }[]>([])
const teachers = ref<{ id: number; full_name: string }[]>([])

const modalOpen = ref(false)
const isEditing = ref(false)
const form = ref<{
  id: number | null
  academic_year_id: number | "" | null
  grade_level: number | null
  section: string
  homeroom_teacher_id: number | "" | null
}>({
  id: null,
  academic_year_id: "",
  grade_level: null,
  section: "",
  homeroom_teacher_id: "",
})

async function loadOptions() {
  const [{ data: years }, { data: tchs }] = await Promise.all([
    supabase.from("academic_years").select("id, year_label").order("year_label", { ascending: false }),
    supabase.from("teachers").select("id, full_name").order("full_name", { ascending: true }),
  ])
  academicYears.value = years ?? []
  teachers.value = tchs ?? []
}

async function load() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from("classrooms")
      .select(`
        id,
        academic_year_id,
        grade_level,
        section,
        homeroom_teacher_id,
        academic_year:academic_year_id ( year_label ),
        homeroom_teacher:homeroom_teacher_id ( full_name )
      `)
      .order("academic_year_id", { ascending: false })
      .order("grade_level", { ascending: true })
      .order("section", { ascending: true })

    if (error) throw error

    rows.value = (data ?? []).map((c: any) => ({
      id: c.id,
      academic_year_id: c.academic_year_id,
      year_label: c.academic_year?.year_label ?? 0,
      grade_level: c.grade_level,
      section: c.section,
      homeroom_teacher_id: c.homeroom_teacher_id,
      homeroom_teacher_name: c.homeroom_teacher?.full_name ?? null,
    }))
  } catch (e) {
    console.error("Error cargando aulas:", e)
    rows.value = []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEditing.value = false
  form.value = {
    id: null,
    academic_year_id: "",
    grade_level: null,
    section: "",
    homeroom_teacher_id: "",
  }
  modalOpen.value = true
}
function openEdit(c: ClassroomRow) {
  isEditing.value = true
  form.value = {
    id: c.id,
    academic_year_id: c.academic_year_id,
    grade_level: c.grade_level,
    section: c.section,
    homeroom_teacher_id: c.homeroom_teacher_id ?? "",
  }
  modalOpen.value = true
}
function closeModal() {
  modalOpen.value = false
}

async function onSubmit() {
  if (!form.value.academic_year_id || !form.value.grade_level || !form.value.section.trim()) {
    alert("Año, grado y sección son obligatorios.")
    return
  }
  const payload = {
    academic_year_id: Number(form.value.academic_year_id),
    grade_level: Number(form.value.grade_level),
    section: form.value.section.trim().toUpperCase(),
    homeroom_teacher_id: form.value.homeroom_teacher_id || null,
  }
  try {
    if (isEditing.value && form.value.id != null) {
      const { error } = await supabase.from("classrooms").update(payload).eq("id", form.value.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from("classrooms").insert(payload)
      if (error) throw error
    }
    modalOpen.value = false
    await load()
  } catch (e: any) {
    console.error("Error guardando aula:", e.message)
    alert("No se pudo guardar el aula. Verifica que no exista repetida (mismo año/grado/sección).")
  }
}

async function onDelete(c: ClassroomRow) {
  const ok = confirm(
    `¿Eliminar el aula ${c.grade_level}° ${c.section} del año ${c.year_label}? (Se eliminarán también ofertas y horarios relacionados)`
  )
  if (!ok) return
  const { error } = await supabase.from("classrooms").delete().eq("id", c.id)
  if (error) {
    console.error("Error al eliminar aula:", error.message)
    alert("No se pudo eliminar.")
    return
  }
  await load()
}

onMounted(async () => {
  await loadOptions()
  await load()
})
</script>

<style scoped>
.input {
  background: #111;
  border: 1px solid #3f3f46;
  border-radius: 0.5rem;
  padding: 0.45rem 0.6rem;
  color: #fff;
}
</style>
