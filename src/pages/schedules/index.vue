<template>
  <div class="p-6 space-y-6">
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-semibold flex items-center gap-2">📝 Matrículas</h1>
      <RouterLink class="text-sm text-blue-400 hover:underline" to="/">
        ⬅ Volver al Dashboard
      </RouterLink>
    </header>

    <!-- Filtros -->
    <div class="flex gap-3 items-center">
      <label class="flex items-center gap-2 text-sm">
        Año académico:
        <select
          v-model="yearFilter"
          @change="load"
          class="bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-sm text-white"
        >
          <option value="">Todos</option>
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </label>

      <Button variant="secondary" @click="load">
        <Icon icon="solar:refresh-line-duotone" />
        Recargar
      </Button>
    </div>

    <!-- Estados -->
    <div v-if="loading" class="text-sm text-gray-400">⏳ Cargando matrículas…</div>
    <div v-else-if="rows.length === 0" class="text-sm text-gray-400">⚠️ No hay matrículas registradas.</div>

    <!-- Tabla -->
    <div v-else class="rounded-lg border border-zinc-700 bg-zinc-900/40 p-3 shadow-sm space-y-3">
      <Table>
        <TableCaption>Lista de matrículas registradas</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[60px]">ID</TableHead>
            <TableHead>Estudiante</TableHead>
            <TableHead>DNI</TableHead>
            <TableHead>Año</TableHead>
            <TableHead>Aula</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha matrícula</TableHead>
            <TableHead class="text-right w-[160px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <TableRow v-for="r in paginatedRows" :key="`row-${r.id}`">
            <TableCell class="font-mono text-xs">#{{ r.id }}</TableCell>
            <TableCell>{{ r.student }}</TableCell>
            <TableCell>{{ r.dni || "—" }}</TableCell>
            <TableCell>{{ r.year }}</TableCell>
            <TableCell>{{ r.grade }}° {{ r.section }}</TableCell>
            <TableCell>
              <span
                class="inline-flex items-center px-2 py-1 rounded text-xs capitalize border"
                :class="{
                  'border-green-500 text-green-400': r.status === 'active',
                  'border-yellow-500 text-yellow-400': r.status === 'withdrawn',
                  'border-sky-500 text-sky-400': r.status === 'transferred',
                }"
              >
                {{ r.status }}
              </span>
            </TableCell>
            <TableCell>{{ r.date }}</TableCell>
            <TableCell class="text-right">
              <div class="flex gap-2 justify-end">
                <Button size="icon-sm" variant="outline" @click="onEdit(r)" title="Editar matrícula">
                  <Icon icon="solar:pen-bold-duotone" />
                </Button>
                <Button size="icon-sm" variant="destructive" @click="onDelete(r)" title="Eliminar matrícula">
                  <Icon icon="solar:trash-bin-trash-bold-duotone" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <!-- Paginación -->
      <div v-if="rows.length > itemsPerPage" class="flex justify-end pt-2 border-t border-zinc-700">
        <Pagination :items-per-page="itemsPerPage" :total="rows.length" :default-page="currentPage">
          <PaginationContent v-slot="{ items }">
            <PaginationPrevious @click="changePage(currentPage - 1)" />
            <template v-for="item in items" :key="item.key">
              <PaginationItem
                v-if="item.type === 'page'"
                :value="item.value"
                :is-active="item.value === currentPage"
                @click="changePage(item.value)"
              >
                {{ item.value }}
              </PaginationItem>
              <PaginationEllipsis v-else-if="item.type === 'ellipsis'" />
            </template>
            <PaginationNext @click="changePage(currentPage + 1)" />
          </PaginationContent>
        </Pagination>
      </div>
    </div>

    <!-- MODAL EDITAR -->
    <div v-if="editOpen" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/60" @click="closeEdit"></div>

      <div class="relative w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-lg">
        <h2 class="text-lg font-semibold mb-4">✏ Editar matrícula #{{ editForm.id }}</h2>

        <form @submit.prevent="onUpdate" class="space-y-4">
          <!-- Año -->
          <div class="grid gap-1">
            <label class="text-sm text-zinc-300">Año académico</label>
            <select v-model="editForm.academic_year_label" @change="loadClassroomsForEdit" class="input">
              <option v-for="y in years" :key="`year-${y}`" :value="y">{{ y }}</option>
            </select>
          </div>

          <!-- Aula -->
          <div class="grid gap-1">
            <label class="text-sm text-zinc-300">Aula (grado y sección)</label>
            <select v-model="editForm.classroom_id" class="input">
              <option v-for="c in editClassrooms" :key="`cls-${c.id}`" :value="c.id">
                {{ c.grade_level }}° {{ c.section }}
              </option>
            </select>
          </div>

          <!-- Estado -->
          <div class="grid gap-1">
            <label class="text-sm text-zinc-300">Estado</label>
            <select v-model="editForm.status" class="input">
              <option value="active">active</option>
              <option value="withdrawn">withdrawn</option>
              <option value="transferred">transferred</option>
            </select>
          </div>

          <!-- Fecha -->
          <div class="grid gap-1">
            <label class="text-sm text-zinc-300">Fecha de matrícula</label>
            <input v-model="editForm.enrolled_at" type="date" class="input" />
          </div>

          <!-- Botones -->
          <div class="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" @click="closeEdit">Cancelar</Button>
            <Button type="submit">Guardar cambios</Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { supabase } from "@/lib/supabaseClient"
import { Icon } from "@iconify/vue"

import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationEllipsis,
} from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"

type RowUI = {
  id: number
  student: string
  dni?: string
  year: number | string
  grade: number | string
  section: string
  status: "active" | "withdrawn" | "transferred"
  date: string
}

const rows = ref<RowUI[]>([])
const years = ref<number[]>([])
const yearFilter = ref<string | number | "">("")
const loading = ref(true)

const itemsPerPage = 30
const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(rows.value.length / itemsPerPage))
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return rows.value.slice(start, start + itemsPerPage)
})
const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page
}

// ---------- CARGA DE DATOS ----------
async function loadYears() {
  const { data, error } = await supabase.from("academic_years").select("year_label").order("year_label", { ascending: false })
  if (!error && data) years.value = data.map((d) => d.year_label)
}

async function yearIdByLabel(label: number) {
  const { data, error } = await supabase.from("academic_years").select("id").eq("year_label", label).single()
  if (error) throw new Error(error.message)
  return data.id as number
}

async function load() {
  loading.value = true
  try {
    let query = supabase
      .from("enrollments")
      .select(`
        id,
        status,
        enrolled_at,
        academic_year:academic_year_id ( year_label ),
        student:student_id ( full_name, dni ),
        classroom:classrooms!fk_enroll_classroom_year ( grade_level, section )
      `)
      .order("id", { ascending: false })
      .limit(200)

    if (yearFilter.value) {
      const yid = await yearIdByLabel(Number(yearFilter.value))
      query = query.eq("academic_year_id", yid)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    rows.value = (data ?? []).map((e: any) => ({
      id: e.id,
      student: e?.student?.full_name ?? "—",
      dni: e?.student?.dni ?? "",
      year: e?.academic_year?.year_label ?? "—",
      grade: e?.classroom?.grade_level ?? "—",
      section: e?.classroom?.section ?? "—",
      status: e.status,
      date: (e.enrolled_at ?? "").slice(0, 10),
    }))
    currentPage.value = 1
  } catch (e: any) {
    console.error("Error al cargar matrículas:", e.message)
    rows.value = []
  } finally {
    loading.value = false
  }
}

// ---------- ELIMINAR ----------
async function onDelete(row: RowUI) {
  const ok = confirm(`¿Eliminar la matrícula #${row.id}?`)
  if (!ok) return
  const { error } = await supabase.from("enrollments").delete().eq("id", row.id)
  if (error) {
    console.error("Error al eliminar matrícula:", error.message)
    alert("No se pudo eliminar la matrícula.")
    return
  }
  await load()
}

// ---------- EDITAR ----------
const editOpen = ref(false)
const editForm = ref<{
  id: number | null
  academic_year_label: number | null
  academic_year_id: number | null
  classroom_id: number | null
  status: "active" | "withdrawn" | "transferred"
  enrolled_at: string
}>({
  id: null,
  academic_year_label: null,
  academic_year_id: null,
  classroom_id: null,
  status: "active",
  enrolled_at: "",
})

const editClassrooms = ref<Array<{ id: number; grade_level: number; section: string }>>([])

async function loadClassroomsForEdit() {
  if (!editForm.value.academic_year_label) return
  try {
    const yid = await yearIdByLabel(editForm.value.academic_year_label)
    editForm.value.academic_year_id = yid
    const { data, error } = await supabase
      .from("classrooms")
      .select("id, grade_level, section")
      .eq("academic_year_id", yid)
      .order("grade_level", { ascending: true })
      .order("section", { ascending: true })
    if (error) throw new Error(error.message)
    editClassrooms.value = data ?? []
    // si el aula actual no está en la lista del nuevo año, limpiar
    if (!editClassrooms.value.find((c) => c.id === editForm.value.classroom_id)) {
      editForm.value.classroom_id = editClassrooms.value[0]?.id ?? null
    }
  } catch (e: any) {
    console.error("Error al cargar aulas por año:", e.message)
  }
}

async function onEdit(row: RowUI) {
  // Prellenar el form
  editForm.value = {
    id: row.id,
    academic_year_label: Number(row.year),
    academic_year_id: null, // se resuelve en loadClassroomsForEdit
    classroom_id: null,     // se setea luego
    status: row.status,
    enrolled_at: row.date,
  }
  editOpen.value = true
  await loadClassroomsForEdit()

  // selecciona aula actual si existe en la lista
  try {
    const yid = await yearIdByLabel(Number(row.year))
    const { data } = await supabase
      .from("enrollments")
      .select("classroom_id")
      .eq("id", row.id)
      .single()
    if (data) {
      editForm.value.academic_year_id = yid
      editForm.value.classroom_id = data.classroom_id
    }
  } catch {}
}

function closeEdit() {
  editOpen.value = false
}

// Guardar cambios (UPDATE)
async function onUpdate() {
  if (!editForm.value.id || !editForm.value.academic_year_id || !editForm.value.classroom_id) {
    alert("Completa año y aula.")
    return
  }
  const payload = {
    academic_year_id: editForm.value.academic_year_id,
    classroom_id: editForm.value.classroom_id,
    status: editForm.value.status,
    enrolled_at: editForm.value.enrolled_at,
  }
  const { error } = await supabase.from("enrollments").update(payload).eq("id", editForm.value.id)
  if (error) {
    console.error("Error al actualizar matrícula:", error.message)
    alert("No se pudo guardar. Revisa los datos.")
    return
  }
  editOpen.value = false
  await load()
}

onMounted(async () => {
  await loadYears()
  await load()
})
</script>

<style scoped>
.input {
  background: #111;
  border: 1px solid #3f3f46;
  border-radius: 0.5rem;
  padding: 0.5rem 0.6rem;
  color: #fff;
}
</style>
