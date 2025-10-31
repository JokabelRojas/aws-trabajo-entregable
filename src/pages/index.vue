<template>
  <div class="dashboard">
    <h1 class="title">Panel Principal</h1>

    <nav class="links">
      <RouterLink class="btn" :to="{ name: '/enrrollments/' }">📝 Matrículas</RouterLink>
      <!-- Ejemplo detalle por ID (ajusta según tu router) -->
    </nav>
  </div>
</template>

<script setup lang="ts">
/* vacío por ahora */
</script>

<style scoped>
.dashboard {
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
}
.title {
  font-size: 1.6rem;
  margin: 0 0 .5rem;
}
.links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: .75rem;
}
.btn {
  display: inline-block;
  padding: .8rem 1rem;
  border-radius: .7rem;
  border: 1px solid #ffffff22;
  text-decoration: none;
  font-weight: 600;
  background: #1f2937;
  transition: transform .12s ease, background .2s ease;
}
.btn:hover {
  transform: translateY(-1px);
  background: #273447;
}
.secondary {
  background: #111827;
}
</style>
