<template>
  <div class="p-6 space-y-6">
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-semibold flex items-center gap-2">👩‍🏫 Docentes</h1>
      <RouterLink class="text-sm text-blue-400 hover:underline" to="/">
        ⬅ Volver al Dashboard
      </RouterLink>
      <div class="flex gap-2">
        <Button variant="secondary" @click="load">🔄 Recargar</Button>
        <Button @click="openCreate">➕ Nuevo docente</Button>
      </div>
    </header>

    <div v-if="loading" class="text-sm text-gray-400">⏳ Cargando docentes…</div>
    <div v-else-if="rows.length === 0" class="text-sm text-gray-400">⚠️ No hay docentes.</div>

    <div v-else class="rounded-lg border border-zinc-700 bg-zinc-900/40 p-3 shadow-sm">
      <Table>
        <TableCaption>Lista de docentes</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[60px]">ID</TableHead>
            <TableHead>Nombre completo</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead class="text-right w-[140px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="t in rows" :key="t.id">
            <TableCell class="font-mono text-xs">#{{ t.id }}</TableCell>
            <TableCell>{{ t.full_name }}</TableCell>
            <TableCell>{{ t.email || "—" }}</TableCell>
            <TableCell>{{ t.phone || "—" }}</TableCell>
            <TableCell class="text-right">
              <div class="flex gap-2 justify-end">
                <Button size="icon-sm" variant="outline" @click="openEdit(t)">✏</Button>
                <Button size="icon-sm" variant="destructive" @click="onDelete(t)">🗑</Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- MODAL -->
    <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/60" @click="closeModal"></div>
      <div class="relative w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-lg">
        <h2 class="text-lg font-semibold mb-4">
          {{ isEditing ? "Editar docente" : "Nuevo docente" }}
        </h2>
        <form @submit.prevent="onSubmit" class="space-y-4">
          <div class="grid gap-1">
            <label class="text-sm text-zinc-200">Nombre completo *</label>
            <input v-model="form.full_name" type="text" class="input" required />
          </div>
          <div class="grid gap-1">
            <label class="text-sm text-zinc-200">Email</label>
            <input v-model="form.email" type="email" class="input" />
          </div>
          <div class="grid gap-1">
            <label class="text-sm text-zinc-200">Teléfono</label>
            <input v-model="form.phone" type="text" class="input" />
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

type Teacher = { id: number; full_name: string; email?: string | null; phone?: string | null }

const rows = ref<Teacher[]>([])
const loading = ref(true)

const modalOpen = ref(false)
const isEditing = ref(false)
const form = ref<{ id: number | null; full_name: string; email: string; phone: string }>({
  id: null,
  full_name: "",
  email: "",
  phone: "",
})

async function load() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from("teachers")
      .select("id, full_name, email, phone")
      .order("id", { ascending: true })
    if (error) throw error
    rows.value = data ?? []
  } catch (e) {
    console.error("Error cargando docentes:", e)
    rows.value = []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEditing.value = false
  form.value = { id: null, full_name: "", email: "", phone: "" }
  modalOpen.value = true
}
function openEdit(t: Teacher) {
  isEditing.value = true
  form.value = {
    id: t.id,
    full_name: t.full_name,
    email: t.email ?? "",
    phone: t.phone ?? "",
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
    full_name: form.value.full_name.trim(),
    email: form.value.email || null,
    phone: form.value.phone || null,
  }
  try {
    if (isEditing.value && form.value.id != null) {
      const { error } = await supabase.from("teachers").update(payload).eq("id", form.value.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from("teachers").insert(payload)
      if (error) throw error
    }
    modalOpen.value = false
    await load()
  } catch (e: any) {
    console.error("Error guardando docente:", e.message)
    alert("No se pudo guardar.")
  }
}

async function onDelete(t: Teacher) {
  const ok = confirm(`¿Eliminar al docente "${t.full_name}"?`)
  if (!ok) return
  const { error } = await supabase.from("teachers").delete().eq("id", t.id)
  if (error) {
    console.error("Error al eliminar docente:", error.message)
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
