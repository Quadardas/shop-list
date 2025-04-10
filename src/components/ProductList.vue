<template>
  <VaSelect
      class="ml-4"
      :options="sortOptions"
      v-model="selectedSortOption"
      placement="right"
  />
  <div class="container ">
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

const products = ref<IProduct[]>([]);
const confirmModal = ref<InstanceType<typeof ConfirmModal> | null>(null);
const toast = useToast();
const productIdToDelete = ref<number | null>(null);
const selectedSortOption = ref<string>('По умолчанию')
const sortOptions = [
  'По умолчанию',
  "По наименованию",

]

function showDeleteConfirmation(id: number) {
  productIdToDelete.value = id;
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
  let sorted = [...products.value];

  switch (selectedSortOption.value) {
    case 'По умолчанию':
      return sorted;
    case "По наименованию":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  return sorted;
})

async function deleteOneProduct(id: number) {
  await dbService.deleteOneProduct(id);
  products.value = await dbService.getAllProductsForSelect();
}

onMounted(async () => {
  products.value = await dbService.getAllProductsForSelect();
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