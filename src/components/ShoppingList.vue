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
    <div class="btn-container">
      <add-product-modal></add-product-modal>
      <va-button
          v-if="productsStore.activeProducts.length"
          class="button"
          preset="secondary"
          type="submit"
          @click="showDeleteConfirmation"
      >
        Очистить список
      </va-button>
      <confirm-modal
          ref="confirmModal"
          @confirm="deleteAll"
      ></confirm-modal>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {ref, onMounted, watch} from 'vue'
import {VaButton, VaOptionList, useToast} from "vuestic-ui"
import {useProductsStore} from '@/stores/products'
import AddProductModal from "@/components/modals/AddProductModal.vue";
import ConfirmModal from "@/components/modals/ConfirmModal.vue";

const selectedProductIds = ref<number[]>([])
const productsStore = useProductsStore()
const confirmModal = ref<InstanceType<typeof ConfirmModal> | null>(null)
const toast = useToast()

function showDeleteConfirmation() {
  confirmModal.value?.show()
}

function deleteAll() {
  try {
    productsStore.activeProducts = []
    productsStore.syncWithDB()
    toast.init({message: 'Список очищен', color: 'success'})
  } catch (error) {
    toast.init({message: 'Ошибка при очистке списка', color: 'danger'})
  }
}

const handleSelectionChange = (selectedIds: number[]) => {
  const updatedProducts = productsStore.activeProducts.map(product => ({
    ...product,
    bought: selectedIds.includes(product.id)
  }));

  productsStore.activeProducts = updatedProducts;
  productsStore.syncWithDB();
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
  display: flex;
  justify-content: space-between;

  .option-list {
    min-width: 30%;
    max-width: 70%;
    word-break: break-all;
  }

  .btn-container {
    

    .button {
      margin-top: 10px;
      width: 170px
    }
  }
}
</style>