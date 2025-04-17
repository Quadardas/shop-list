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
  <VaButton
      preset="secondary"
      @click="showDeleteConfirmation"
  >Удалить все
  </VaButton>
  <div class="container ml-4">
    <VaList>
      <VaListItem v-for="product in sortedProducts" :key="product.id">
        <VaListItemSection>
          <VaListItemLabel>{{ product.name }}</VaListItemLabel>
          <VaListItemLabel caption>
            <VaButton
                preset="secondary"
                @click="showDeleteConfirmation(product.id)"
            >Удалить
            </VaButton>
          </VaListItemLabel>
        </VaListItemSection>
      </VaListItem>
    </VaList>
  </div>
  <confirm-modal
      ref="confirmModal"
      @confirm="confirmDelete"
  ></confirm-modal>
</template>

<script lang="ts" setup>
import {useToast, VaButton, VaList, VaListItem, VaListItemLabel, VaListItemSection, VaSelect} from "vuestic-ui";
import {computed, onMounted, ref} from "vue";
import type {IProduct} from "@/models/product.model.ts";
import {dbService} from "@/components/services/DB.service.ts";
import ConfirmModal from "@/components/modals/ConfirmModal.vue";
import {sortProductStrategies} from "@/utils/sort.ts";

const products = ref<IProduct[]>([]);
const confirmModal = ref<InstanceType<typeof ConfirmModal> | null>(null);
const toast = useToast();
const productIdToDelete = ref<number | null>(null);
const selectedSortOption = ref<string>('По умолчанию')
const selectedSortType = ref<string>('По убыванию')
const sortOptions = [
  'По умолчанию',
  "По наименованию",
]
const sortType = [
  "По убыванию",
  'По возрастанию',
]


function showDeleteConfirmation(id?: number) {
  if (id) {
    productIdToDelete.value = id;
  }
  confirmModal.value?.show();
}

async function confirmDelete() {
  if (productIdToDelete.value !== null) {
    try {
      await deleteOneProduct(productIdToDelete.value);
      toast.init({message: 'Товар удалён', color: 'success'});
    } catch (error) {
      toast.init({message: 'Ошибка при удалении товара', color: 'danger'});
    } finally {
      productIdToDelete.value = null;
    }
  }
}

const sortedProducts = computed(() => {
  const option = selectedSortOption.value;
  const type = selectedSortType.value;
  const productsaboba = products.value; // уже не знаю как их называть)

  const strategy = sortProductStrategies[option];
  return strategy ? strategy(productsaboba, type) : products;
});

async function deleteOneProduct(id: number) {
  await dbService.deleteOneProduct(id);
  await update()
}

async function deleteAllProducts() {
  await dbService.deleteAllProducts();
  await update()
}

async function update() {
  products.value = await dbService.getAllProductsForSelect();
}

onMounted(async () => {
  await update()
});
</script>

<style lang="scss" scoped>
.container {
  margin: 10px;

  .va-list-item {
    font-size: 20px;
  }
}
</style>