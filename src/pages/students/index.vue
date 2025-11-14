<template>
  <div class="p-6 space-y-6">
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-semibold flex items-center gap-2">👩‍🎓 Estudiantes</h1>
      <RouterLink class="text-sm text-blue-400 hover:underline" to="/">
        ⬅ Volver al Dashboard
      </RouterLink>
      <div class="flex gap-2">
        <Button variant="secondary" @click="load">🔄 Recargar</Button>
        <Button @click="openCreate">➕ Nuevo estudiante</Button>
      </div>
    </header>

    <div v-if="loading" class="text-sm text-gray-400">⏳ Cargando estudiantes…</div>
    <div v-else-if="rows.length === 0" class="text-sm text-gray-400">⚠️ No hay estudiantes.</div>

    <div v-else class="rounded-lg border border-zinc-700 bg-zinc-900/40 p-3 shadow-sm overflow-x-auto">
      <Table>
        <TableCaption>Lista de estudiantes</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[60px]">ID</TableHead>
            <TableHead>DNI</TableHead>
            <TableHead>Nombre completo</TableHead>
            <TableHead>Fecha nacimiento</TableHead>
            <TableHead>Apoderado</TableHead>
            <TableHead>Teléfono apoderado</TableHead>
            <TableHead class="text-right w-[140px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="s in rows" :key="s.id">
            <TableCell class="font-mono text-xs">#{{ s.id }}</TableCell>
            <TableCell>{{ s.dni || "—" }}</TableCell>
            <TableCell>{{ s.full_name }}</TableCell>
            <TableCell>{{ s.birth_date || "—" }}</TableCell>
            <TableCell>{{ s.guardian_name || "—" }}</TableCell>
            <TableCell>{{ s.guardian_phone || "—" }}</TableCell>
            <TableCell class="text-right">
              <div class="flex gap-2 justify-end">
                <Button size="icon-sm" variant="outline" @click="openEdit(s)">✏</Button>
                <Button size="icon-sm" variant="destructive" @click="onDelete(s)">🗑</Button>
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
          {{ isEditing ? "Editar estudiante" : "Nuevo estudiante" }}
        </h2>
        <form @submit.prevent="onSubmit" class="space-y-4">
          <div class="grid gap-1 md:grid-cols-2 md:gap-4">
            <div class="grid gap-1">
              <label class="text-sm text-zinc-200">DNI</label>
              <input v-model="form.dni" type="text" class="input" maxlength="12" />
            </div>
            <div class="grid gap-1">
              <label class="text-sm text-zinc-200">Fecha nacimiento</label>
              <input v-model="form.birth_date" type="date" class="input" />
            </div>
          </div>

          <div class="grid gap-1">
            <label class="text-sm text-zinc-200">Nombre completo *</label>
            <input v-model="form.full_name" type="text" class="input" required />
          </div>

          <div class="grid gap-1 md:grid-cols-2 md:gap-4">
            <div class="grid gap-1">
              <label class="text-sm text-zinc-200">Nombre apoderado</label>
              <input v-model="form.guardian_name" type="text" class="input" />
            </div>
            <div class="grid gap-1">
              <label class="text-sm text-zinc-200">Teléfono apoderado</label>
              <input v-model="form.guardian_phone" type="text" class="input" />
            </div>
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

type Student = {
  id: number
  dni?: string | null
  full_name: string
  birth_date?: string | null
  guardian_name?: string | null
  guardian_phone?: string | null
}

const rows = ref<Student[]>([])
const loading = ref(true)

const modalOpen = ref(false)
const isEditing = ref(false)
const form = ref<{
  id: number | null
  dni: string
  full_name: string
  birth_date: string
  guardian_name: string
  guardian_phone: string
}>({
  id: null,
  dni: "",
  full_name: "",
  birth_date: "",
  guardian_name: "",
  guardian_phone: "",
})

async function load() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from("students")
      .select("id, dni, full_name, birth_date, guardian_name, guardian_phone")
      .order("id", { ascending: true })
    if (error) throw error
    rows.value = (data ?? []).map((s: any) => ({
      ...s,
      birth_date: s.birth_date ? s.birth_date.slice(0, 10) : null,
    }))
  } catch (e) {
    console.error("Error cargando estudiantes:", e)
    rows.value = []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEditing.value = false
  form.value = {
    id: null,
    dni: "",
    full_name: "",
    birth_date: "",
    guardian_name: "",
    guardian_phone: "",
  }
  modalOpen.value = true
}
function openEdit(s: Student) {
  isEditing.value = true
  form.value = {
    id: s.id,
    dni: s.dni || "",
    full_name: s.full_name,
    birth_date: s.birth_date || "",
    guardian_name: s.guardian_name || "",
    guardian_phone: s.guardian_phone || "",
  }
  modalOpen.value = true
}
function closeModal() {
  modalOpen.value = false
}

async function onSubmit() {
  if (!form.value.full_name.trim()) {
    alert("El nombre es obligatorio.")
    return
  }
  const payload = {
    dni: form.value.dni || null,
    full_name: form.value.full_name.trim(),
    birth_date: form.value.birth_date || null,
    guardian_name: form.value.guardian_name || null,
    guardian_phone: form.value.guardian_phone || null,
  }
  try {
    if (isEditing.value && form.value.id != null) {
      const { error } = await supabase.from("students").update(payload).eq("id", form.value.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from("students").insert(payload)
      if (error) throw error
    }
    modalOpen.value = false
    await load()
  } catch (e: any) {
    console.error("Error guardando estudiante:", e.message)
    alert("No se pudo guardar.")
  }
}

async function onDelete(s: Student) {
  const ok = confirm(`¿Eliminar al estudiante "${s.full_name}"?`)
  if (!ok) return
  const { error } = await supabase.from("students").delete().eq("id", s.id)
  if (error) {
    console.error("Error al eliminar estudiante:", error.message)
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
