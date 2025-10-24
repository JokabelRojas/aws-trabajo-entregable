<template>
    <div>
        <h1>Dashboard</h1>
        <RouterLink :to="{name:'/carrera/'}">Ir a carrera</RouterLink>
        <RouterLink :to="{name:'/carrera/[id]',params:{id:5}}">Ir a la carrera 5</RouterLink>
    </div>
</template>

<script setup lang="ts">
</script>

<style scoped>

</style>
