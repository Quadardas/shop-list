<template>
  <div class="container">
    <div class="input-container">
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
    </div>
    <div class="btn-container">
      <VaButton
          preset="secondary"
          @click="showDeleteConfirmation()"
      >
        Удалить все
      </VaButton>
      <VaButton
          preset="secondary"
          @click="addCategory(null)"
      >
        Добавить категорию
      </VaButton>
    </div>
  </div>
  <div class="container ml-4">
    <VaTreeView
        :key="searchQuery"
        :nodes="displayTree"
        text-by="name"
        :filter="searchQuery"
        expand-all
        :expanded="Array(searchQuery)"
    >
      <template #content="{ id, name, type }">
        <div class="tree-node-row" :class="type">
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
                <VaMenuItem @click="showDeleteConfirmation(id, type)">Удалить</VaMenuItem>
              </div>

            </VaMenu>
          </div>
        </div>
      </template>
    </VaTreeView>
  </div>
  <add-category-modal
      ref="addCategoryModal"
      :editableCategory="editableCategory"
      :parentCategoryId="parentCategoryId"
      :isEdit="isEdit"
      @close="()=> {isEdit = false, loadData()}"
  />
  <add-product-modal
      ref="addProductModal"
      :editableProduct="editableProduct"
      :categoryId="categoryId"
      :isEdit="isEdit"
      @close="()=> {isEdit = false, loadData()}"
  />
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
import {buildTree} from "@/utils/treeBuilder.ts";
import type {IProduct} from "@/models/product.model.ts";
import type {ICategory} from "@/models/category.model.ts";
import type {TreeNode} from "@/models/tree-node.model.ts";
import AddCategoryModal from "@/components/modals/AddCategoryModal.vue";
import AddProductModal from "@/components/modals/AddProductModal.vue";

const categories = ref<ICategory[]>([]);
const products = ref<IProduct[]>([]);
const confirmModal = ref<InstanceType<typeof ConfirmModal> | null>(null);
const addCategoryModal = ref<InstanceType<typeof AddCategoryModal> | null>(null)
const addProductModal = ref<InstanceType<typeof AddProductModal> | null>(null)
const toast = useToast();
const productIdToDelete = ref<number | null>(null);
const selectedSortOption = ref("По умолчанию");
const selectedSortType = ref("По убыванию");
const searchQuery = ref("");
const baseTree = ref<TreeNode[]>([]);
const displayTree = ref<TreeNode[]>([]);
const deleteType = ref<'product' | 'category' | null>(null);
const editableCategory = ref<ICategory | null>(null)
const isEdit = ref<boolean>(false)
const parentCategoryId = ref<number | null>(null);
const editableProduct = ref<IProduct | null>(null)
const categoryId = ref<number | null>(null);

const sortOptions = ["По умолчанию", "По наименованию"];
const sortType = ["По убыванию", "По возрастанию"];

function addCategory(parentId: number | null) {
  isEdit.value = false;
  editableCategory.value = null;
  parentCategoryId.value = parentId;
  addCategoryModal.value?.show();

}

function editItem(id: number, type: string) {
  isEdit.value = true
  if (type === "category") {
    editableCategory.value = categories.value.find(cat => cat.id == id);
    addCategoryModal.value?.show();
  }
  else {
    editableProduct.value = products.value.find(product => product.id == id);
    addProductModal.value?.show();
  }
}

function addProduct(id: number) {
  isEdit.value = false
  categoryId.value = id;
  // editable.value = JSON.parse(JSON.stringify());
  addProductModal.value?.show();
}

function showDeleteConfirmation(id?: number, type?: 'product' | 'category') {
  if (id && type) {
    productIdToDelete.value = id;
    deleteType.value = type;
  } else {
    productIdToDelete.value = null;
    deleteType.value = null;
  }
  confirmModal.value?.show();
}


async function confirmDelete() {
  try {
    if (productIdToDelete.value !== null && deleteType.value !== null) {
      if (deleteType.value === 'product') {
        await dbService.deleteOneProduct(productIdToDelete.value);
        toast.init({message: "Товар удалён", color: "success"});
      } else if (deleteType.value === 'category') {
        await dbService.deleteCategory(productIdToDelete.value);
        toast.init({message: "Категория удалена", color: "success"});
      }
    } else {
      await dbService.deleteAllProducts();
      toast.init({message: "Товары удалены", color: "success"});
    }

    await loadData();
  } catch {
    toast.init({message: "Ошибка при удалении", color: "danger"});
  } finally {
    productIdToDelete.value = null;
    deleteType.value = null;
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
  display: flex;
  gap: 10px;

  .input-container {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;

    .va-input {
      height: min-content;
    }
  }

  .btn-container {
    display: flex;

    button {
      width: 100%;
    }
  }

  .va-list-item {
    font-size: 20px;
  }

  .tree-node-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 8px;

    &.category {
      font-weight: 600;
    }
    &.product {
      margin-left: 10px;
    }

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
