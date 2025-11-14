<template>
  <div class="p-6 space-y-6">
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-semibold flex items-center gap-2">📚 Cursos</h1>
      <RouterLink class="text-sm text-blue-400 hover:underline" to="/">
        ⬅ Volver al Dashboard
      </RouterLink>
      <div class="flex gap-2">
        <Button variant="secondary" @click="load">🔄 Recargar</Button>
        <Button @click="openCreate">➕ Nuevo curso</Button>
      </div>
    </header>

    <div v-if="loading" class="text-sm text-gray-400">
      ⏳ Cargando cursos…
    </div>

    <div v-else-if="rows.length === 0" class="text-sm text-gray-400">
      ⚠️ No hay cursos registrados.
    </div>

    <div v-else class="rounded-lg border border-zinc-700 bg-zinc-900/40 p-3 shadow-sm">
      <Table>
        <TableCaption>Lista de cursos registrados</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[60px]">ID</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead class="text-right w-[140px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="c in rows" :key="c.id">
            <TableCell class="font-mono text-xs">#{{ c.id }}</TableCell>
            <TableCell>{{ c.code || "—" }}</TableCell>
            <TableCell>{{ c.name }}</TableCell>
            <TableCell class="text-right">
              <div class="flex gap-2 justify-end">
                <Button size="icon-sm" variant="outline" @click="openEdit(c)" title="Editar">
                  ✏
                </Button>
                <Button size="icon-sm" variant="destructive" @click="onDelete(c)" title="Eliminar">
                  🗑
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- MODAL CREAR/EDITAR -->
    <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/60" @click="closeModal"></div>
      <div class="relative w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-lg">
        <h2 class="text-lg font-semibold mb-4">
          {{ isEditing ? "Editar curso" : "Nuevo curso" }}
        </h2>
        <form @submit.prevent="onSubmit" class="space-y-4">
          <div class="grid gap-1">
            <label class="text-sm text-zinc-200">Nombre *</label>
            <input v-model="form.name" type="text" class="input" required />
          </div>
          <div class="grid gap-1">
            <label class="text-sm text-zinc-200">Código</label>
            <input v-model="form.code" type="text" class="input" />
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

type Course = { id: number; name: string; code?: string | null }

const rows = ref<Course[]>([])
const loading = ref(true)

const modalOpen = ref(false)
const isEditing = ref(false)
const form = ref<{ id: number | null; name: string; code: string | null }>({
  id: null,
  name: "",
  code: "",
})

async function load() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from("courses")
      .select("id, name, code")
      .order("id", { ascending: true })

    if (error) throw error
    rows.value = data ?? []
  } catch (e) {
    console.error("Error al cargar cursos:", e)
    rows.value = []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEditing.value = false
  form.value = { id: null, name: "", code: "" }
  modalOpen.value = true
}
function openEdit(c: Course) {
  isEditing.value = true
  form.value = { id: c.id, name: c.name, code: c.code ?? "" }
  modalOpen.value = true
}
function closeModal() {
  modalOpen.value = false
}

async function onSubmit() {
  if (!form.value.name.trim()) {
    alert("El nombre es obligatorio.")
    return
  }
  try {
    if (isEditing.value && form.value.id != null) {
      const { error } = await supabase
        .from("courses")
        .update({ name: form.value.name.trim(), code: form.value.code || null })
        .eq("id", form.value.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from("courses")
        .insert({ name: form.value.name.trim(), code: form.value.code || null })
      if (error) throw error
    }
    modalOpen.value = false
    await load()
  } catch (e: any) {
    console.error("Error guardando curso:", e.message)
    alert("No se pudo guardar el curso.")
  }
}

async function onDelete(c: Course) {
  const ok = confirm(`¿Eliminar el curso "${c.name}"?`)
  if (!ok) return
  const { error } = await supabase.from("courses").delete().eq("id", c.id)
  if (error) {
    console.error("Error al eliminar curso:", error.message)
    alert("No se pudo eliminar.")
    return
  }
  await load()
}

onMounted(load)
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
