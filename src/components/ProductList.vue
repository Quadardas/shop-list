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
        :key="searchQuery"
        :nodes="displayTree"
        text-by="name"
        :filter="searchQuery"
        expand-all
    >
      <template #content="{ id, name, type }">
        <div class="tree-node-row">
          <span>{{ name }}</span>

          <div class="menu-container">
            <VaMenu :close-on-content-click="false">
              <template #anchor>
                <VaButton
                    icon="more_vert"
                    preset="secondary"
                    class="kebab-button"
                    size="small"
                />
              </template>
              <div>
                <div v-if="type === 'category'">
                  <VaMenuItem @click="addCategory(id)">Добавить категорию</VaMenuItem>
                  <VaMenuItem @click="addProduct(id)">Добавить продукт</VaMenuItem>
                </div>
                <VaMenuItem @click="editItem(id, type)">Редактировать</VaMenuItem>
                <VaMenuItem @click="showDeleteConfirmation(id)">Удалить</VaMenuItem>
              </div>

            </VaMenu>
          </div>
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
import {ref, computed, onMounted, watch} from "vue";
import {useToast, VaButton, VaSelect, VaTreeView} from "vuestic-ui";
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
const baseTree = ref<TreeNode[]>([]);
const displayTree = ref<TreeNode[]>([]);


const sortOptions = ["По умолчанию", "По наименованию"];
const sortType = ["По убыванию", "По возрастанию"];
function addCategory(){

}
function editItem(id: number){

}
function addProduct(id: number){

}

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

watch([selectedSortOption, selectedSortType, baseTree], () => {
  const cloned = JSON.parse(JSON.stringify(baseTree.value));
  displayTree.value = sortTreeRecursively(cloned, selectedSortOption.value, selectedSortType.value);
});

async function loadData() {
  products.value = await dbService.getAllProductsForSelect();
  categories.value = await dbService.getAllCategories();
  baseTree.value = buildTree(categories.value, products.value);
}

onMounted(loadData);
</script>

<style lang="scss" scoped>
.container {
  margin: 10px;

  .va-list-item {
    font-size: 20px;
  }
  .tree-node-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 8px;

    .menu-container {
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    &:hover .menu-container {
      opacity: 1;
    }

    .kebab-button {
      padding: 0;
      min-width: 32px;
      width: 32px;
      height: 32px;
    }
  }

}
</style>
