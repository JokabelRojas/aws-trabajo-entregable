<template>
  <div class="matriculas">
    <header class="header">
      <h1>📝 Matrículas</h1>
      <RouterLink class="back" to="/">⬅ Volver al Dashboard</RouterLink>
    </header>

    <div class="filters">
      <label>
        Año académico:
        <select v-model="yearFilter" @change="load">
          <option value="">Todos</option>
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </label>
      <button class="reload" @click="load">🔄 Recargar</button>
    </div>

    <div v-if="loading" class="status">⏳ Cargando matrículas…</div>
    <div v-else-if="rows.length === 0" class="status">⚠️ No hay matrículas registradas.</div>

    <ul v-else class="grid">
      <li v-for="r in rows" :key="r.id" class="card">
        <div class="row">
          <strong>#{{ r.id }}</strong>
          <span class="pill" :data-status="r.status">{{ r.status }}</span>
        </div>
        <p><strong>Estudiante:</strong> {{ r.student }} <span v-if="r.dni">({{ r.dni }})</span></p>
        <p><strong>Año:</strong> {{ r.year }}</p>
        <p><strong>Aula:</strong> {{ r.grade }}° {{ r.section }}</p>
        <p><strong>Fecha matrícula:</strong> {{ r.date }}</p>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'

// estado
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rows = ref<any[]>([])
const years = ref<number[]>([])
const yearFilter = ref<string | number | ''>('')
const loading = ref(true)

// cargar lista de años académicos
async function loadYears() {
  const { data, error } = await supabase
    .from('academic_years')
    .select('year_label')
    .order('year_label', { ascending: false })

  if (!error && data) years.value = data.map((d) => d.year_label)
}

// obtener id de año según label
async function yearIdByLabel(label: number) {
  const { data, error } = await supabase
    .from('academic_years')
    .select('id')
    .eq('year_label', label)
    .single()
  if (error) {
    console.error('⚠️ No se encontró el año académico', label, error.message)
    return -1
  }
  return data.id
}

// cargar matrículas
async function load() {
  loading.value = true
  try {
    let query = supabase
      .from('enrollments')
      .select(`
        id,
        status,
        enrolled_at,
        academic_year:academic_year_id ( year_label ),
        student:student_id ( full_name, dni ),
        classroom:classrooms!fk_enroll_classroom_year ( grade_level, section )
      `)
      .order('id', { ascending: false })
      .limit(200)

    if (yearFilter.value) {
      const yearId = await yearIdByLabel(Number(yearFilter.value))
      if (yearId !== -1) query = query.eq('academic_year_id', yearId)
    }

    const { data, error } = await query
    if (error) {
      console.error('❌ Error al cargar matrículas:', error.message)
      rows.value = []
      return
    }

    rows.value = (data ?? []).map((e: any) => ({
      id: e.id,
      student: e?.student?.full_name ?? '—',
      dni: e?.student?.dni ?? '',
      year: e?.academic_year?.year_label ?? '—',
      grade: e?.classroom?.grade_level ?? '—',
      section: e?.classroom?.section ?? '—',
      status: e.status,
      date: e.enrolled_at
    }))
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadYears()
  await load()
})
</script>

<style scoped>
.matriculas {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
}

.back {
  text-decoration: none;
  opacity: .85;
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filters select {
  background: #111;
  border: 1px solid #ffffff22;
  border-radius: .5rem;
  padding: .35rem .6rem;
  color: #fff;
}

.reload {
  background: #1f2937;
  border: 1px solid #ffffff22;
  border-radius: .5rem;
  padding: .35rem .8rem;
  cursor: pointer;
  color: #fff;
  transition: background .2s ease;
}
.reload:hover {
  background: #334155;
}

.status {
  padding: .8rem 1rem;
  border: 1px dashed #ffffff33;
  border-radius: .6rem;
}

.grid {
  list-style: none;
  padding: 0;
  display: grid;
  gap: .9rem;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.card {
  border: 1px solid #ffffff22;
  border-radius: .9rem;
  padding: 1rem;
  background: #0f172a80;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: .4rem;
}

.pill {
  padding: .2rem .5rem;
  border-radius: .6rem;
  font-size: .8rem;
  border: 1px solid #ffffff22;
  text-transform: capitalize;
}

.pill[data-status="active"] { border-color: #16a34a; }
.pill[data-status="withdrawn"] { border-color: #eab308; }
.pill[data-status="transferred"] { border-color: #38bdf8; }
</style>
