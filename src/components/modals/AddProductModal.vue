<template>
  <VaModal
      no-dismiss
      v-model="showModal"
      hideDefaultActions
      cancel-text="Отмена"
      @cancel="resetForm"
  >
    <form @submit.prevent="handleSubmit">
      <div class="container">
        <div class="input-container">
          <VaInput
              v-if="isEdit"
              v-model="editableProductName"
              label="Название продукта"
              :rules="[(v) => !!v || 'Введите название']"
              maxlength="20"
          />

          <VaSelect
              v-if="isEdit"
              v-model="selectedCategoryId"
              label="Категория"
              :options="categories"
              value-by="id"
              text-by="name"
              clearable
              allow-create="unique"
              @create-new="addNewCategory"
          />

          <VaSelect
              v-else
              v-model="selectedProductId"
              clearable
              :maxLength="20"
              searchable
              :options="groupedProducts"
              value-by="id"
              text-by="name"
              group-by="group"
              label="Продукт"
              allow-create="unique"
              @create-new="addNewProduct"
          />
        </div>

        <div class="count-container">
          <VaCounter
              v-if="!isProductListEdit"
              v-model="quantity"
              label="Количество"
              manual-input
              :min="1"
          />

          <VaSelect
              v-model="selectedUnitId"
              label="Единицы измерения"
              :options="units"
              value-by="id"
              text-by="name"
              allow-create="unique"
              clearable
              @create-new="addNewUnit"
          />
        </div>
      </div>

      <div class="btn-container">
        <VaButton
            preset="secondary"
            @click="() => { resetForm(); showModal = false }"
        >
          Отмена
        </VaButton>
        <VaButton @click="handleSubmit">
          ОК
        </VaButton>
      </div>
    </form>
  </VaModal>
</template>

<script lang="ts" setup>
import { computed, onBeforeMount, ref, watch } from "vue";
import {
  useToast,
  VaButton,
  VaCounter,
  VaInput,
  VaModal,
  VaSelect,
} from "vuestic-ui";
import { dbService } from "@/components/services/DB.service.ts";
import { useProductsStore } from "@/stores/products.ts";
import { useRoute } from "vue-router";
import type { IProduct } from "@/models/product.model.ts";
import type { ICategory } from "@/models/category.model.ts";
import type { IUnit } from "@/models/unit.model.ts";

const { notify } = useToast();
const showModal = ref(false);
const products = ref<IProduct[]>([]);
const categories = ref<ICategory[]>([]);
const units = ref<IUnit[]>([]);
const quantity = ref(1);
const selectedProductId = ref<number | null>(null);
const selectedUnitId = ref<number | null>(null);
const selectedCategoryId = ref<number | null>(null);
const editableProductName = ref("");

const productsStore = useProductsStore();
const route = useRoute();

const props = defineProps<{
  editableProduct: IProduct | null;
  isEdit: boolean;
  categoryId: number | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const isProductListEdit = computed(() => route.path.includes("product-list"));

defineExpose({
  show: () => (showModal.value = true),
  hide: () => {
    showModal.value = false;
    emit("close");
  },
});

function getFullCategoryPath(categoryId: number | null, categories: ICategory[]): string {
  if (!categoryId) return "Без категории";
  const path: string[] = [];
  let current = categories.find(c => c.id === categoryId);

  while (current) {
    path.unshift(current.name);
    current = categories.find(c => c.id === current?.parentId || null);
  }

  return path.join(". ");
}

const groupedProducts = computed(() =>
    products.value.map((product) => {
      const group = getFullCategoryPath(product.categoryId, categories.value);
      return {
        ...product,
        group,
      };
    })
);

function editProduct() {
  if (!props.editableProduct) return;

  selectedProductId.value = props.editableProduct.id;
  quantity.value = props.editableProduct.count;
  selectedUnitId.value = props.editableProduct.unit?.id ?? null;
  selectedCategoryId.value = props.editableProduct.categoryId ?? null;
  editableProductName.value = props.editableProduct.name;
}

const addNewUnit = async (newUnitNameRaw: string) => {
  const trimmedName = newUnitNameRaw.slice(0, 20);
  const unitToAdd = { id: Date.now(), name: trimmedName };
  await dbService.addUnit(unitToAdd);
  units.value = [...units.value, unitToAdd];
  selectedUnitId.value = unitToAdd.id;
};

const addNewCategory = async (newCategoryNameRaw: string) => {
  const trimmedName = newCategoryNameRaw.slice(0, 20);
  const categoryToAdd = { id: Date.now(), name: trimmedName };
  await dbService.createCategory(categoryToAdd.id, categoryToAdd.name, null);
  categories.value = [...categories.value, categoryToAdd];
  selectedCategoryId.value = categoryToAdd.id;
};

const addNewProduct = async (newProductNameRaw: string) => {
  const trimmedName = newProductNameRaw.slice(0, 20);
  const productToAdd = {
    id: Date.now(),
    name: trimmedName,
    categoryId: props.categoryId || null,
  };
  await dbService.addProduct(productToAdd);
  products.value = [...products.value, productToAdd];
  selectedProductId.value = productToAdd.id;
};

const handleSubmit = async () => {
  let selectedProduct: IProduct | undefined;

  if (props.isEdit) {
    if (!props.editableProduct) return;
    selectedProduct = { ...props.editableProduct };
    selectedProduct.name = editableProductName.value.trim().slice(0, 20);
  } else {
    selectedProduct = products.value.find(p => p.id === selectedProductId.value);
    if (!selectedProduct) {
      notify({ message: "Выберите или создайте продукт", color: "danger" });
      return;
    }
  }

  if (!selectedUnitId.value) {
    notify({ message: "Выберите единицу измерения", color: "danger" });
    return;
  }

  const unitObj = units.value.find((u) => u.id === selectedUnitId.value);

  const updatedProduct: IProduct = {
    ...selectedProduct,
    count: isProductListEdit.value ? selectedProduct.count : quantity.value,
    unit: unitObj,
    bought: false,
    categoryId: selectedCategoryId.value ?? selectedProduct.categoryId ?? null,
  };

  try {
    const listId = +route.params.id;

    if (isProductListEdit.value) {
      await dbService.updateProduct(updatedProduct);
    } else {
      if (props.isEdit) {
        await dbService.updateProductInList(updatedProduct, listId);
      } else {
        await dbService.addProductToList(updatedProduct, listId);
      }
    }

    if (!isNaN(listId)) {
      await productsStore.loadFromDB(listId);
    }

    await updateAll();
    emit("close");
    resetForm();
    notify({
      message: props.isEdit ? "Продукт обновлён" : "Добавлено успешно",
      color: "success",
    });
    showModal.value = false;
  } catch (error) {
    console.error("Ошибка:", error);
    notify({ message: "Ошибка при сохранении продукта", color: "danger" });
  }
};

const resetForm = () => {
  selectedProductId.value = null;
  quantity.value = 1;
  selectedUnitId.value = null;
  selectedCategoryId.value = null;
  editableProductName.value = "";
};

async function updateAll() {
  products.value = await dbService.getAllProductsForSelect();
  categories.value = await dbService.getAllCategories();
  units.value = await dbService.getAllUnits();
}

watch(
    () => props.editableProduct,
    (newProduct) => {
      if (showModal.value && newProduct) {
        editProduct();
      } else if (showModal.value && !newProduct) {
        resetForm();
      }
    }
);

onBeforeMount(async () => {
  await updateAll();
});
</script>

<style scoped lang="scss">
.input-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.count-container {
  display: flex;
  gap: 10px;
}

.btn-container {
  display: flex;
  margin-top: 10px;
  justify-content: flex-end;
}
</style>
