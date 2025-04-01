<template>
  <div class="container">
    <VaOptionList
        v-model="selectedProducts"
        :options="products"
        value-by="id"
        :text-by="(product) => `${product.name} (${product.count} шт.)`"
    />

    <div>Выбранные продукты:</div>
    <pre>{{ selectedProducts }}</pre>
  </div>
</template>

<script lang="ts" setup>
import {ref, onMounted, watch} from 'vue'
import {VaOptionList} from "vuestic-ui"
import {dbService} from "@/components/services/DB.service.ts";
import type {IProduct} from "@/models/product.model.ts"

const products = ref<any[]>([])
const selectedProducts = ref<IProduct[]>([])

function updateSelectedProducts(id: number) {
  // console.log(selectedProducts.value)
}

onMounted(async () => {
  try {
    await dbService.getAllProducts()

    const existingProducts = await dbService.getAllProducts()
    if (existingProducts.length === 0) {
      await dbService.addProduct({id: 1, name: 'Молоко', count: 15, bought: false})
      await dbService.addProduct({id: 2, name: 'Хлеб', count: 20, bought: false})
      await dbService.addProduct({id: 3, name: 'Яйца', count: 30, bought: false})
    }

    products.value = await dbService.getAllProducts()
  } catch (error) {
    console.error("Ошибка при работе с IndexedDB:", error)
  }
})

watch(selectedProducts, (product) => {
  console.log(selectedProducts.value)
})

// selectedProducts.value = await dbService.updateProducts(selectedProducts.value)
</script>

<style lang="scss" scoped>
.container {
  margin: 10px;
  padding: 10px;
}
</style>