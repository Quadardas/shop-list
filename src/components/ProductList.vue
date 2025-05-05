<template>
  <VaInput
      v-model="searchQuery"
      class="ml-4"
      placeholder="Поиск"
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
  <VaButton
      preset="secondary"
      @click="showDeleteConfirmation()"
  >
    Удалить все
  </VaButton>
  <div class="container ml-4">
    <VaTreeView
        :nodes="sortedTree"
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
  />
</template>

<script lang="ts" setup>
import {ref, computed, onMounted} from "vue";
import {useToast, VaButton, VaSelect} from "vuestic-ui";
import ConfirmModal from "@/components/modals/ConfirmModal.vue";
import {dbService} from "@/components/services/DB.service.ts";
import {sortProductStrategies} from "@/utils/sort.ts";
import {buildTree} from "@/utils/treeBuilder.ts";
import type {IProduct} from "@/models/product.model.ts";
import type {ICategory} from "@/models/category.model.ts";
import type {TreeNode} from "@/models/tree-node.model.ts";

const categories = ref<ICategory[]>([]);
const products = ref<IProduct[]>([]);
const confirmModal = ref<InstanceType<typeof ConfirmModal> | null>(null);
const toast = useToast();
const productIdToDelete = ref<number | null>(null);
const selectedSortOption = ref("По умолчанию");
const selectedSortType = ref("По убыванию");
const searchQuery = ref("");

const sortOptions = ["По умолчанию", "По наименованию"];
const sortType = ["По убыванию", "По возрастанию"];

function showDeleteConfirmation(id?: number) {
  if (id) {
    productIdToDelete.value = id;
  }
  confirmModal.value?.show();
}

async function confirmDelete() {
  try {
    if (productIdToDelete.value !== null) {
      await dbService.deleteOneProduct(productIdToDelete.value);
      toast.init({message: "Товар удалён", color: "success"});
    } else {
      await dbService.deleteAllProducts();
      toast.init({message: "Товары удалены", color: "success"});
    }
    await loadData();
  } catch {
    toast.init({message: "Ошибка при удалении", color: "danger"});
  } finally {
    productIdToDelete.value = null;
  }
}

function sortTreeRecursively(nodes: TreeNode[], sortBy: string, sortOrder: string): TreeNode[] {
  const sorted = [...nodes].sort((a, b) => {
    const aValue = a.name.toLowerCase();
    const bValue = b.name.toLowerCase();
    return sortOrder === "По возрастанию"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
  });

  for (const node of sorted) {
    if (node.children) {
      node.children = sortTreeRecursively(node.children, sortBy, sortOrder);
    }
  }

  return sorted;
}

function filterTreeByQuery(nodes: TreeNode[], query: string): TreeNode[] {
  const lowerQuery = query.toLowerCase();

  const filterRecursive = (node: TreeNode): TreeNode | null => {
    const nameMatch = node.name.toLowerCase().includes(lowerQuery);
    const children = node.children?.map(filterRecursive).filter(Boolean) as TreeNode[] | undefined;

    return nameMatch || (children && children.length > 0)
        ? {...node, children}
        : null;
  };

  return nodes.map(filterRecursive).filter((n): n is TreeNode => n !== null);
}

const sortedTree = computed(() => {
  const sortBy = selectedSortOption.value;
  const sortOrder = selectedSortType.value;
  const baseTree = buildTree(categories.value, products.value);
  const sorted = sortTreeRecursively(baseTree, sortBy, sortOrder);

  return searchQuery.value.trim()
      ? filterTreeByQuery(sorted, searchQuery.value.trim())
      : sorted;
});

async function loadData() {
  products.value = await dbService.getAllProductsForSelect();
  categories.value = await dbService.getAllCategories();
}

onMounted(loadData);
</script>

<style lang="scss" scoped>
.container {
  margin: 10px;

  .va-list-item {
    font-size: 20px;
  }
}
</style>
