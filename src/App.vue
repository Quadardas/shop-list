<template>
  <nav-bar/>
  <div class="content">
    <router-view/>
  </div>
</template>

<script lang="ts" setup>

import NavBar from "@/components/NavBar.vue";
import {onMounted} from "vue";
import {dbService} from "@/components/services/DB.service.ts";

const categories = [
  {id: 1, name: 'Продукты', parentId: null},
  {id: 2, name: 'Молочные продукты', parentId: 1},
  {id: 3, name: 'Мясо', parentId: 1},
  {id: 4, name: 'Сыры', parentId: 2},
];
onMounted(() => {
  // dbService.createCategory('Сыры', 1745914352067)
})
</script>

<style>

</style>