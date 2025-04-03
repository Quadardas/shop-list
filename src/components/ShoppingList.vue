<template>
  <div class="container">
    <VaOptionList
        v-model="selectedProductIds"
        :options="productsStore.activeProducts"
        value-by="id"
        :text-by="(product) => `${product.name} (${product.count} шт.)`"
        @update:modelValue="handleSelectionChange"
    />
    <va-button class="button" type="submit" @click="deleteAll">Очистить список</va-button>
  </div>
</template>

<script lang="ts" setup>
import {ref, onMounted} from 'vue'
import {VaButton, VaOptionList} from "vuestic-ui"
import {dbService} from "@/components/services/DB.service.ts"
import type {IProduct} from "@/models/product.model.ts"
import {useProductsStore} from '@/stores/products'

// const products = ref<IProduct[]>([])
const selectedProductIds = ref<number[]>([])
const productsStore = useProductsStore()

function deleteAll() {
  dbService.deleteAll()
}

const handleSelectionChange = (selectedIds: number[]) => {

  productsStore.activeProducts.forEach(product => {
    product.bought = selectedIds.includes(product.id)
  })
}
// const handleSelectionChange = async (selectedIds: number[]) => {
//   try {
//     products.value = productsStore.activeProducts
//     products.value.map(async (product) => {
//       const shouldBeBought = selectedIds.includes(product.id)
//
//       if (product.bought !== shouldBeBought) {
//         const updatedProduct = {...product, bought: shouldBeBought}
//
//         await dbService.updateProduct(updatedProduct)
//
//         product.bought = shouldBeBought
//       }
//     })
//   } catch (error) {
//     console.error("Ошибка при обновлении продуктов:", error)
//   }
// }

onMounted(async () => {
  selectedProductIds.value = productsStore.activeProducts
      .filter(p => p.bought)
      .map(p => p.id)
})
// onMounted(async () => {
//   try {
//     const existingProducts = await dbService.getAllProducts()
//
//     if (existingProducts.length === 0) {
//       await dbService.addProduct({id: 1, name: 'Молоко', count: 15, bought: false})
//       await dbService.addProduct({id: 2, name: 'Хлеб', count: 20, bought: false})
//       await dbService.addProduct({id: 3, name: 'Яйца', count: 30, bought: false})
//       products.value = await dbService.getAllProducts()
//     } else {
//       products.value = existingProducts
//       selectedProductIds.value = existingProducts
//           .filter(p => p.bought)
//           .map(p => p.id)
//     }
//   } catch (error) {
//     console.error("Ошибка при работе с IndexedDB:", error)
//   }
// })
</script>

<style lang="scss" scoped>
.container {
  margin: 20px;

  .button {
    margin: 10px;
  }
}


</style>