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
      <VaCardTitle v-if="!productsStore.activeProducts.length">Тут пока пусто</VaCardTitle>
      <VaCardContent>
        <div v-for="category in groupedProducts" :key="category.id">
          <div class="category-title">{{ category.fullPath }}</div>
          <div
              class="option-list"
              v-for="product in category.products"
              :key="product.id"
          >
            <VaCheckbox
                :model-value="selectedProductIds.includes(product.id)"
                :label="product.name + ` (${product.count} ${product.unit?.name || 'ед.'})`"
                :disabled="props.isArchive"
                @update:modelValue="(checked) => toggleProductSelection(product.id, checked)"
            />
            <div class="icon-container">
              <VaIcon
                  v-if="!props.isArchive"
                  name="edit"
                  @click="editproduct(product)"
              />
              <VaIcon
                  v-if="!props.isArchive"
                  name="delete"
                  @click="deleteProduct(product.id)"
              />
            </div>
          </div>
        </div>
      </VaCardContent>
    </VaCard>

    <div class="btn-container" v-if="!props.isArchive">
      <add-product-modal
          ref="addProductModal"
          :editableProduct="editableProduct"
          :isEdit="isEdit"
          @close="isEdit = false"
      />
      <div class="btn-container">
        <va-button @click="openAddProductModal">Добавить продукт</va-button>
        <va-button
            v-if="productsStore.activeProducts.length"
            class="button"
            preset="secondary"
            type="submit"
            @click="showDeleteConfirmation"
        >
          Очистить список
        </va-button>
      </div>
      <confirm-modal
          ref="confirmModal"
          @confirm="deleteAll"
      ></confirm-modal>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {ref, onMounted, watch, computed, capitalize} from 'vue'
import {VaButton, useToast, VaSelect, VaCard, VaCardTitle, VaCardContent, VaIcon} from "vuestic-ui"
import {useProductsStore} from '@/stores/products'
import AddProductModal from "@/components/modals/AddProductModal.vue";
import ConfirmModal from "@/components/modals/ConfirmModal.vue";
import {dbService} from "@/components/services/DB.service.ts";
import {useRoute, useRouter} from "vue-router";
import {sortProductStrategies} from "@/utils/sort.ts";
import type {IProduct} from "@/models/product.model.ts";
import type {ICategory} from "@/models/category.model.ts";

const selectedProductIds = ref<number[]>([])
const selectedSortOption = ref<string>('По умолчанию')
const selectedSortType = ref<string>('По убыванию')
const productsStore = useProductsStore()
const categories = ref<ICategory[]>([])
const confirmModal = ref<InstanceType<typeof ConfirmModal> | null>(null)
const addProductModal = ref<InstanceType<typeof AddProductModal> | null>(null)
const editableProduct = ref<IProduct | null>(null)
const toast = useToast()
const route = useRoute()
const router = useRouter()
const isEdit = ref<boolean>(false)

const props = defineProps<{
  isArchive: boolean,
}>()

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

const toggleProductSelection = async (productId: number, checked: boolean) => {
  const listId = +route.params.id;
  const product = productsStore.activeProducts.find(p => p.id === productId);

  if (product && product.bought !== checked) {
    product.bought = checked;
    await dbService.updateProductBoughtStatus(listId, productId, checked);
    productsStore.syncWithDB();
  }
};

function editproduct(product: IProduct) {
  isEdit.value = true
  editableProduct.value = JSON.parse(JSON.stringify(product));
  addProductModal.value?.show();
}

function openAddProductModal() {
  isEdit.value = false;
  editableProduct.value = null;
  addProductModal.value?.show();
}

async function deleteProduct(id: number) {
  await dbService.deleteOneProductFromCard(+route.params.id, id);
  await productsStore.loadFromDB(+route.params.id)
}

function showDeleteConfirmation() {
  confirmModal.value?.show()
}

async function deleteAll() {
  try {
    productsStore.activeProducts = []
    await dbService.deleteAllProductsFromCard(+route.params.id)
    toast.init({message: 'Список очищен', color: 'success'})
  } catch (error) {
    toast.init({message: 'Ошибка при очистке списка', color: 'danger'})
  }
}

watch(
    () => productsStore.activeProducts,
    (newProducts) => {
      selectedProductIds.value = newProducts
          .filter(p => p.bought)
          .map(p => p.id)
      if (selectedProductIds.value.length == productsStore.activeProducts.length &&
          selectedProductIds.value.length > 0 &&
          !props.isArchive) {
        dbService.addToArchive(+route.params.id)
        toast.init({message: 'Список будет перенесен в архив', color: 'success'})
        router.push(`/card-list/`)
      }
    },
    {immediate: true, deep: true}
)

function getFormattedCategoryPath(categoryId: number): string {
  const category = categories.value.find(c => c.id === categoryId);
  if (!category) return '';

  const pathParts: string[] = [capitalize(category.name)];
  let currentId = category.parentId;

  while (currentId) {
    const parent = categories.value.find(c => c.id === currentId);
    if (parent) {
      pathParts.unshift(capitalize(parent.name));
      currentId = parent.parentId;
    } else {
      currentId = null;
    }
  }

  return pathParts.join('. ');
}

const groupedProducts = computed(() => {
  const productsByCategory: Record<number, IProduct[]> = {};
  productsStore.activeProducts.forEach(product => {
    if (!productsByCategory[product.categoryId]) {
      productsByCategory[product.categoryId] = [];
    }
    productsByCategory[product.categoryId].push(product);
  });

  const result: Array<{
    id: number,
    fullPath: string,
    products: IProduct[]
  }> = [];

  Object.keys(productsByCategory).forEach(categoryIdStr => {
    const categoryId = Number(categoryIdStr);
    const categoryProducts = productsByCategory[categoryId];

    if (categoryProducts.length > 0) {
      result.push({
        id: categoryId,
        fullPath: getFormattedCategoryPath(categoryId),
        products: sortProductsInCategory(categoryProducts)
      });
    }
  });

  result.sort((a, b) => a.fullPath.localeCompare(b.fullPath));

  return result;
});

function sortProductsInCategory(products: IProduct[]) {
  const option = selectedSortOption.value;
  const type = selectedSortType.value;
  const strategy = sortProductStrategies[option];
  return strategy ? strategy(products, type) : products;
}

onMounted(async () => {
  if (props.isArchive) {
    productsStore.activeProducts = await dbService.getProductsFromListById(+route.params.id, props.isArchive)
  } else {
    await productsStore.loadFromDB(+route.params.id)
    selectedProductIds.value = productsStore.activeProducts
        .filter(p => p.bought)
        .map(p => p.id)
  }
  categories.value = await dbService.getAllCategories()
})
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

    .va-card__content {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  }

  .category-title {
    font-weight: bold;
    margin: 15px 0 5px 0;
    padding: 5px 10px;
    background-color: #f5f5f5;
    border-radius: 4px;
  }

  .option-list {
    min-width: 30%;
    word-break: break-all;
    display: flex;
    justify-content: space-between;
    margin-left: 20px;
    padding: 5px 0;

    .icon-container {
      margin-left: 10px;
      display: flex;
      gap: 10px;

      .va-icon {
        cursor: pointer;
        color: #154EC1;
      }
    }
  }

  :deep(.va-checkbox--selected) {
    label {
      text-decoration: line-through;
    }
  }

  .btn-container {
    display: flex;
    max-height: 40px;
    flex-direction: column;

    .button {
      margin-top: 10px;
      width: 170px
    }
  }
}
</style>