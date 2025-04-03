<template>
  <nav-bar/>
  <shopping-list/>
</template>

<script lang="ts" setup>

import NavBar from "@/components/NavBar.vue";
import ShoppingList from "@/components/ShoppingList.vue";
import {onMounted, onUnmounted, ref} from "vue";
import {useProductsStore} from '@/stores/products.ts';
import {dbService} from "@/components/services/DB.service.ts";

const productsStore = useProductsStore();
const syncInterval = ref<number>();

const startSyncTimer = () => {
  syncInterval.value = setInterval(async () => {
    if (!productsStore.isSyncing) {
      try {
        await productsStore.syncWithDB();
        console.log(productsStore.activeProducts);
      } catch (error) {
        console.error('Sync error:', error);
      }
    }
  }, 10000);
}

onMounted(async () => {
  await productsStore.loadFromDB();
  startSyncTimer()
  if (productsStore.activeProducts.length === 0) {
    await dbService.addProduct({id: 1, name: 'Молоко', count: 15, bought: false})
    await dbService.addProduct({id: 2, name: 'Хлеб', count: 20, bought: false})
    await dbService.addProduct({id: 3, name: 'Яйца', count: 30, bought: false})
    await productsStore.loadFromDB();
  }

});

onUnmounted(() => clearInterval(syncInterval.value));
</script>

<style>

</style>