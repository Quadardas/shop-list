<template>
  <nav-bar/>
  <div class="content">
    <router-view/>
  </div>
</template>

<script lang="ts" setup>

import NavBar from "@/components/NavBar.vue";
import {onMounted, onUnmounted, ref} from "vue";
import {useProductsStore} from '@/stores/products.ts';
import {dbService} from "@/components/services/DB.service.ts";
import {useRoute} from "vue-router";

const productsStore = useProductsStore();
const syncInterval = ref<number>();


// const startSyncTimer = () => {
//   syncInterval.value = setInterval(async () => {
//     if (!productsStore.isSyncing) {
//       try {
//         await productsStore.syncWithDB();
//
//       } catch (error) {
//         console.error('Sync error:', error);
//       }
//     }
//   }, 5000);
// }

onMounted(async () => {


  // await dbService.createList({
  //       id: 123,
  //       name: 'aboba',
  //       dateCreate: '14.04.2025',
  //       products: [
  //         {
  //           bought: false,
  //           count: 2,
  //           id: 1744284405131,
  //           name: "Кофе",
  //           unit: {
  //             id: 1744284401147,
  //             name: "шт"
  //           }
  //         },
  //
  //         {
  //           bought: false,
  //           count: 2,
  //           id: 1744284405123,
  //           name: "молоко",
  //           unit: {
  //             id: 1744284401147,
  //             name: "шт"
  //           }
  //         }]
  //     }
  // )
  // startSyncTimer()
  // if (productsStore.activeProducts.length === 0) {
  // await dbService.addProduct({
  //   bought: false,
  //   count: 2,
  //   id: 1744284405131,
  //   name: "Кофе",
  //   unit: {
  //     id: 1744284401147,
  //     name: "шт"
  //   }
  // })
  //   await dbService.addProduct({id: 2, name: 'Хлеб', count: 20, bought: false})
  //   await dbService.addProduct({id: 3, name: 'Яйца', count: 30, bought: false})
  //   await productsStore.loadFromDB();
  // }

});

onUnmounted(() => clearInterval(syncInterval.value));
</script>

<style>

</style>