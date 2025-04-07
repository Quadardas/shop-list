<template>
  <div class="container">

    <VaOptionList
        class="option-list"
        v-model="selectedProductIds"
        :options="productsStore.activeProducts"
        value-by="id"
        :text-by="(product) => `${product.name} (${product.count} шт.)`"
        @update:modelValue="handleSelectionChange"
    />
    <add-product-modal
    ></add-product-modal>
    <va-button
        v-if="productsStore.activeProducts.length"
        class="button"
        preset="secondary"
        type="submit"
        @click="deleteAll">Очистить
      список
    </va-button>

  </div>
</template>

<script lang="ts" setup>
import {ref, onMounted, watch} from 'vue'
import {VaButton, VaOptionList} from "vuestic-ui"
import {useProductsStore} from '@/stores/products'
import AddProductModal from "@/components/modals/AddProductModal.vue";


const selectedProductIds = ref<number[]>([])
const productsStore = useProductsStore()

function deleteAll() {
  productsStore.activeProducts = []
}

const handleSelectionChange = (selectedIds: number[]) => {

  const updatedProducts = productsStore.activeProducts.map(product => ({
    ...product,
    bought: selectedIds.includes(product.id)
  }));

  productsStore.activeProducts = updatedProducts;
}

watch(
    () => productsStore.activeProducts,
    (newProducts) => {
      selectedProductIds.value = newProducts
          .filter(p => p.bought)
          .map(p => p.id)
    },
    {immediate: true, deep: true}
)

onMounted(async () => {

  selectedProductIds.value = productsStore.activeProducts
      .filter(p => p.bought)
      .map(p => p.id)
})

</script>

<style lang="scss" scoped>
.container {
  margin: 20px;


  .button {
    margin-top: 10px;
    width: 170px

  }
}


</style>