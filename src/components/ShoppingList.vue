<template>
  <VaSelect
      class="ml-4"
      :options="sortOptions"
      v-model="selectedSortOption"
      placement="right"
  />
  <VaSelect
      class="ml-4"
      :options="sortType"
      v-model="selectedSortType"
      placement="right"
  />
  <div class="container">
    <VaCard>
      <VaCardTitle v-if="!productsStore.activeProducts.length"> Тут пока пусто</VaCardTitle>
      <VaCardContent>
        <VaOptionList
            class="option-list"
            v-model="selectedProductIds"
            :options="sortedProducts"
            value-by="id"
            :text-by="(product) => getProductText(product)"
            @update:modelValue="handleSelectionChange"
        >
        </VaOptionList>
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
import {ref, onMounted, watch, computed, onBeforeUnmount} from 'vue'
import {VaButton, VaOptionList, useToast, VaSelect, VaCard, VaCardTitle, VaCardContent, VaIcon} from "vuestic-ui"
import {useProductsStore} from '@/stores/products'
import AddProductModal from "@/components/modals/AddProductModal.vue";
import ConfirmModal from "@/components/modals/ConfirmModal.vue";
import {dbService} from "@/components/services/DB.service.ts";
import {useRoute} from "vue-router";
import {sortProductStrategies} from "@/utils/sort.ts";

const selectedProductIds = ref<number[]>([])
const selectedSortOption = ref<string>('По умолчанию')
const selectedSortType = ref<string>('По убыванию')
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
const sortType = [
  "По убыванию",
  'По возрастанию',
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

const handleSelectionChange = async (selectedIds: number[]) => {
  const listId = +route.params.id;

  for (const product of productsStore.activeProducts) {
    const shouldBeBought = selectedIds.includes(product.id);
    if (product.bought !== shouldBeBought) {
      product.bought = shouldBeBought;
      await dbService.updateProductBoughtStatus(listId, product.id, shouldBeBought);
    }
  }
  productsStore.syncWithDB();
};


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
  const option = selectedSortOption.value;
  const type = selectedSortType.value;
  const products = productsStore.activeProducts;

  const strategy = sortProductStrategies[option];
  return strategy ? strategy(products, type) : products;
});


</script>

<style lang="scss" scoped>

.container {
  margin: 20px;
  display: flex;
  justify-content: space-between;

  .va-card {
    min-width: 40%;

    .va-card-title {
      font-size: 18px;

    }
  }

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
