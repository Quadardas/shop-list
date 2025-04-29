<template>
  <VaInput
      v-model="searchQuery"
      class="ml-4"
      placeholder="Поиск "
      clearable
  />
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
  <VaButton v-if="sortedProducts"
            preset="secondary"
            @click="showDeleteConfirmation()"
  >Удалить все
  </VaButton>
  <div class="container ml-4">
    <VaTreeView
        :nodes="tree"
        text-by="name"
        children-by="children"
        :expand-all="true"
    >
      <template #item="{ item }">
        <div style="display: flex; align-items: center">
          <span>{{ item.name }}</span>
          <VaButton
              v-if="item.type === 'product'"
              size="small"
              color="danger"
              class="ml-2"
              @click="showDeleteConfirmation(item.id)"
          >
            Удалить
          </VaButton>
        </div>
      </template>
    </VaTreeView>

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
import {buildTree} from '@/utils/treeBuilder.ts'
import type {TreeNode} from '@/models/tree-node.model.ts'
import type {ICategory} from '@/models/category.model.ts'

const categories = ref<ICategory[]>([])
const tree = ref<TreeNode[]>([])
const products = ref<IProduct[]>([]);
const confirmModal = ref<InstanceType<typeof ConfirmModal> | null>(null);
const toast = useToast();
const productIdToDelete = ref<number | null>(null);
const selectedSortOption = ref<string>('По умолчанию')
const selectedSortType = ref<string>('По убыванию')
const searchQuery = ref<string>('');
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
  console.log(productIdToDelete.value);
  if (productIdToDelete.value !== null) {
    try {
      await deleteOneProduct(productIdToDelete.value);
      toast.init({message: 'Товар удалён', color: 'success'});
    } catch (error) {
      toast.init({message: 'Ошибка при удалении товара', color: 'danger'});
    } finally {
      productIdToDelete.value = null;
    }
  } else {
    try {
      await deleteAllProducts();
      toast.init({message: 'Товары удалены', color: 'success'});
    } catch (error) {
      toast.init({message: 'Ошибка при удалении товаров', color: 'danger'});
    }
  }
}

const sortedProducts = computed(() => {
  const option = selectedSortOption.value;
  const type = selectedSortType.value;
  const productsaboba = products.value; // уже не знаю как их называть)

  const filtered = productsaboba.filter(list =>
      list.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );

  const strategy = sortProductStrategies[option];
  return strategy ? strategy(filtered, type) : products;
});

async function deleteOneProduct(id: number) {
  await dbService.deleteOneProduct(id);
  await loadData()
}

async function deleteAllProducts() {
  await dbService.deleteAllProducts();
  await loadData()
}

// async function update() {
//   products.value = await dbService.getAllProductsForSelect();
// }
async function loadData() {
  products.value = await dbService.getAllProductsForSelect()
  categories.value = await dbService.getAllCategories()
  tree.value = buildTree(categories.value, products.value)
  console.log(tree.value)
}


onMounted(async () => {
  await loadData()
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