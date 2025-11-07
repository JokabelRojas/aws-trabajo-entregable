<template>
  <div class="p-6 space-y-6">
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-semibold flex items-center gap-2">📝 Matrículas</h1>
      <RouterLink class="text-sm text-blue-400 hover:underline" to="/">
        ⬅ Volver al Dashboard
      </RouterLink>
    </header>

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


    <div v-if="loading" class="text-sm text-gray-400">
      ⏳ Cargando matrículas…
    </div>

    <div v-else-if="rows.length === 0" class="text-sm text-gray-400">
      ⚠️ No hay matrículas registradas.
    </div>

    <div
      v-else
      class="rounded-lg border border-zinc-700 bg-zinc-900/40 p-3 shadow-sm space-y-3"
    >
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
            <TableHead class="text-right w-[130px]">Acciones</TableHead>
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

                <Button
                  size="icon-sm"
                  variant="outline"
                  @click="onEdit(r)"
                  title="Editar matrícula"
                >
                  <Icon icon="solar:pen-bold-duotone" />
                </Button>


                <Button
                  size="icon-sm"
                  variant="destructive"
                  @click="onDelete(r)"
                  title="Eliminar matrícula"
                >
                  <Icon icon="solar:trash-bin-trash-bold-duotone" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div
        v-if="rows.length > itemsPerPage"
        class="flex justify-end pt-2 border-t border-zinc-700"
      >
        <Pagination
          :items-per-page="itemsPerPage"
          :total="rows.length"
          :default-page="currentPage"
        >
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { supabase } from "@/lib/supabaseClient"
import { Icon } from "@iconify/vue"

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"

import { Button } from "@/components/ui/button"

const rows = ref<any[]>([])
const years = ref<number[]>([])
const yearFilter = ref<string | number | "">("")
const loading = ref(true)


const itemsPerPage = 30
const currentPage = ref(1)

const totalPages = computed(() =>
  Math.ceil(rows.value.length / itemsPerPage)
)


const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}


const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return rows.value.slice(start, end)
})

async function loadYears() {
  const { data, error } = await supabase
    .from("academic_years")
    .select("year_label")
    .order("year_label", { ascending: false })

  if (!error && data) years.value = data.map((d) => d.year_label)
}

async function yearIdByLabel(label: number) {
  const { data, error } = await supabase
    .from("academic_years")
    .select("id")
    .eq("year_label", label)
    .single()
  if (error) {
    console.error("No se encontró el año académico", label, error.message)
    return -1
  }
  return data.id
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
      const yearId = await yearIdByLabel(Number(yearFilter.value))
      if (yearId !== -1) query = query.eq("academic_year_id", yearId)
    }

    const { data, error } = await query
    if (error) {
      console.error("Error al cargar matrículas:", error.message)
      rows.value = []
      return
    }

    rows.value = (data ?? []).map((e: any) => ({
      id: e.id,
      student: e?.student?.full_name ?? "—",
      dni: e?.student?.dni ?? "",
      year: e?.academic_year?.year_label ?? "—",
      grade: e?.classroom?.grade_level ?? "—",
      section: e?.classroom?.section ?? "—",
      status: e.status,
      date: e.enrolled_at,
    }))

    currentPage.value = 1
  } finally {
    loading.value = false
  }
}

function onEdit(row: any) {
  console.log("✏ Editar matrícula:", row)
}

async function onDelete(row: any) {
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

onMounted(async () => {
  await loadYears()
  await load()
})
</script>
