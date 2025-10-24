<template>
    <div>
        <h1>Carreras</h1>
        <RouterLink :to="{name:'/'}"> Ir al dashboard </RouterLink>
        <ul>
        <li v-for="car in carreras" :key="car.id">
        {{ car.id }} - {{ car.name }}
        </li>
        </ul>

    </div>
</template>

<script setup lang="ts">
  import { supabase } from '@/lib/supabaseClient';
  import { ref } from 'vue';

  const carreras = ref();

  (async()=>{
      const {data,error}= await supabase.from ('carrera').select()
      if (error) console.log(error)
      carreras.value= data
      console.log(data)
  })()

</script>

<style scoped>

</style>


