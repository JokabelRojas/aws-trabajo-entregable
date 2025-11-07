<script setup lang="ts">
import { RouterView } from 'vue-router'
import Input from '@/components/ui/input/Input.vue';
import Avatar from './components/ui/avatar/Avatar.vue';
import AvatarImage from './components/ui/avatar/AvatarImage.vue';
import AvatarFallback from './components/ui/avatar/AvatarFallback.vue';
import DropdownMenu from './components/ui/dropdown-menu/DropdownMenu.vue';
import DropdownMenuTrigger from './components/ui/dropdown-menu/DropdownMenuTrigger.vue';
import DropdownMenuContent from './components/ui/dropdown-menu/DropdownMenuContent.vue';
import DropdownMenuLabel from './components/ui/dropdown-menu/DropdownMenuLabel.vue';
import DropdownMenuSeparator from './components/ui/dropdown-menu/DropdownMenuSeparator.vue';
import DropdownMenuItem from './components/ui/dropdown-menu/DropdownMenuItem.vue';
import { Icon } from "@iconify/vue";

</script>

<template>
 <main>
  <nav class="h-16 border-b bg-muted/40 flex justify-between px-6 items-center">
  <form class="w-full max-w-96 flex items-center justify-center gap-3" action="">
  <Input class="w-full pl-8 bg-background" />
  <Icon icon="oui:search" class="text-red-500 size-6.5" />
  </form>
  <DropdownMenu>
  <DropdownMenuTrigger>
   <Avatar class="w-8 h-8 rounded-full bg-amber-300">
     <AvatarImage src="https://e7.pngegg.com/pngimages/596/585/png-clipart-alexander-the-great-macedonia-portrait-greek-greece-king-man-empire-line-art-thumbnail.png"  alt="Jokabel" />
     <AvatarFallback></AvatarFallback>

  </Avatar>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
    <DropdownMenuSeparator/>
    <DropdownMenuItem>Mi perfil</DropdownMenuItem>
    <DropdownMenuItem>Mis matriculas</DropdownMenuItem>
    <DropdownMenuItem>Carreras</DropdownMenuItem>
    <DropdownMenuItem>Cerrar sesión</DropdownMenuItem>
  </DropdownMenuContent>
  </DropdownMenu>

  </nav>

 </main>

  <RouterView />
</template>

<style scoped>

</style>
