<template>
  <VaSelect
      class="ml-4"
      :options="sortOptions"
      v-model="selectedSortOption"
      placement="right"
  />
  <div class="container">
    <VaCard>
      <VaCardTitle></VaCardTitle>
      <VaCardContent>
        <VaOptionList
            class="option-list"
            v-model="selectedProductIds"
            :options="sortedProducts"
            value-by="id"
            :text-by="(product) => getProductText(product)"
            @update:modelValue="handleSelectionChange"
        />
      </VaCardContent>
    </VaCard>

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
import {ref, onMounted, watch, computed} from 'vue'
import {VaButton, VaOptionList, useToast, VaSelect, VaCard, VaCardTitle, VaCardContent} from "vuestic-ui"
import {useProductsStore} from '@/stores/products'
import AddProductModal from "@/components/modals/AddProductModal.vue";
import ConfirmModal from "@/components/modals/ConfirmModal.vue";
import {dbService} from "@/components/services/DB.service.ts";
import {useRoute} from "vue-router";

const selectedProductIds = ref<number[]>([])
const selectedSortOption = ref<string>('По умолчанию')
const productsStore = useProductsStore()
const confirmModal = ref<InstanceType<typeof ConfirmModal> | null>(null)
const toast = useToast()
const route = useRoute()

const sortOptions = [
  'По умолчанию',
  "По наименованию",
  "По количеству",
  'По дате добавления'
]

function showDeleteConfirmation() {
  confirmModal.value?.show()
}

async function deleteAll() {
  try {
    productsStore.activeProducts = []
    await dbService.deleteAllProducts(+route.params.id)
    toast.init({message: 'Список очищен', color: 'success'})
  } catch (error) {
    toast.init({message: 'Ошибка при очистке списка', color: 'danger'})
  }
}

const getProductText = (product: any) => {
  const unitName = product.unit?.name || 'ед.';
  return `${product.name} (${product.count} ${unitName})`
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
  await productsStore.loadFromDB(+route.params.id)
  selectedProductIds.value = productsStore.activeProducts
      .filter(p => p.bought)
      .map(p => p.id)
})

const sortedProducts = computed(() => {
  let result = [...productsStore.activeProducts];

  switch (selectedSortOption.value) {
    case 'По умолчанию':
      return result;
    case "По наименованию":
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "По количеству":
      result.sort((a, b) => a.count - b.count);
      break;
    case "По дате добавления":
      result.sort((a, b) => a.id - b.id);
      break;
  }

  return result;
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

  :deep(.va-checkbox--selected) {
    label {
      text-decoration: line-through;
    }
  }

  .btn-container {
    .button {
      margin-top: 10px;
      width: 170px
    }
  }
}
</style>
