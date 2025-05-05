<template>

  <VaModal
      no-dismiss
      v-model="showModal"
      hideDefaultActions
      cancel-text="Отмена"
      @cancel="resetForm"
  >
    <form
        @submit.prevent="handleSubmit">
      <div class="container">
        <div class="input-container">
          <VaSelect
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
        <VaSelect
            v-model="selectedParentCategoryId"
            label="Категория"
            :options="categories"
            value-by="id"
            text-by="name"
            clearable
            allow-create="unique"
            @create-new="addNewCategory"
        />

        <VaSelect
            v-model="selectedCategoryId"
            label="Подкатегория"
            :options="childCategories"
            value-by="id"
            text-by="name"
            clearable
            allow-create="unique"
            @create-new="addNewCategory"
        />


        <div class="count-container">
          <VaCounter
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
            @click="()=>{
            resetForm();
            showModal=false
          }">
          Отмена
        </VaButton>
        <VaButton
            @click="handleSubmit">
          ОК
        </VaButton>
      </div>
    </form>
  </VaModal>
</template>

<script lang="ts" setup>
import {computed, nextTick, onBeforeMount, onMounted, ref, watch} from "vue";
import {useToast, VaButton, VaCounter, VaInput, VaModal, VaSelect} from 'vuestic-ui';
import type {IProduct} from "@/models/product.model.ts";
import {dbService} from "@/components/services/DB.service.ts";
import {useProductsStore} from "@/stores/products.ts";
import type {IUnit} from "@/models/unit.model.ts";
import {useRoute} from "vue-router";
import type {ICategory} from "@/models/category.model.ts";

const {notify} = useToast()

const showModal = ref(false);
const products = ref<IProduct[]>([]);
const categories = ref<ICategory[]>([])
const units = ref<IUnit[]>([]);
const quantity = ref(1);
const newProductName = ref('');
const selectedParentCategoryId = ref<number | null>(null);
const selectedProductId = ref<number | null>(null);
const selectedCategoryId = ref<number | null>(null);
const selectedUnitId = ref<number | null>(null);
const productsStore = useProductsStore();
const route = useRoute()
const props = defineProps<{
  editableProduct: IProduct | null;
  isEdit: boolean;
}>()
const emit = defineEmits<{
  (e: 'close'): void;
}>();

defineExpose({
  show: () => showModal.value = true,
  hide: () => {
    showModal.value = false;
    emit('close')
  }
})

const groupedProducts = computed(() => {
  return products.value.map(product => {
    const category = categories.value.find(cat => cat.id === product.categoryId);
    return {
      ...product,
      group: category?.name || 'Без категории'
    };
  });
});

const maskedValue = computed({
  get() {
    return newProductName.value
  },
  set(v) {
    newProductName.value = v.slice(0, 20)
  }
})

function editProduct() {
  if (!props.editableProduct) return;

  newProductName.value = props.editableProduct.name;
  selectedProductId.value = props.editableProduct.id;
  quantity.value = props.editableProduct.count;
  selectedUnitId.value = props.editableProduct.unit?.id ?? null;
  selectedCategoryId.value = props.editableProduct.categoryId ?? null;
}

const addNewCategory = async (newCategoryNameRaw: string) => {
  const trimmedName = newCategoryNameRaw.slice(0, 20);

  const newCategory = {
    id: Date.now(),
    name: trimmedName,
    parentId: selectedParentCategoryId.value || null,
  };
  try {
    await dbService.createCategory(newCategory.id, newCategory.name, newCategory.parentId);
    categories.value.push(newCategory);
    selectedCategoryId.value = newCategory.id;
    notify({message: 'Категория добавлена', color: 'success'});
  } catch (err) {
    notify({message: 'Ошибка при добавлении категории', color: 'danger'});
    console.error(err);
  }
};


const addNewUnit = async (newUnitNameRaw: string) => {
  const trimmedName = newUnitNameRaw.slice(0, 20);

  const unitToAdd = {
    id: Date.now(),
    name: trimmedName,
  };

  await dbService.addUnit(unitToAdd);
  units.value = [...units.value, unitToAdd];
  selectedUnitId.value = unitToAdd.id;
};

const addNewProduct = async (newProductNameRaw: string) => {
  const trimmedName = newProductNameRaw.slice(0, 20);

  const productToAdd = {
    id: Date.now(),
    name: trimmedName,
    categoryId: selectedCategoryId.value || selectedParentCategoryId.value,
  };

  await dbService.addProduct(productToAdd);
  products.value = [...products.value, productToAdd];
  selectedProductId.value = productToAdd.id;
};

const handleSubmit = async () => {
  const productName = products.value.find(p => p.id === selectedProductId.value)?.name ?? maskedValue.value;

  if (!productName) {
    notify({message: 'Введите название или выберите из списка', color: 'danger'});
    return;
  }

  if (selectedUnitId.value == null) {
    notify({message: 'Введите единицу измерения', color: 'danger'});
    return;
  }

  const unitObj = units.value.find(u => u.id === selectedUnitId.value);

  const productToSubmit: IProduct = {
    id: selectedProductId.value ?? Date.now(),
    name: productName,
    count: quantity.value,
    bought: false,
    unit: unitObj,
    categoryId: selectedCategoryId.value || selectedParentCategoryId.value,
  };

  try {
    const listId = +route.params.id;

    if (props.isEdit == true) {
      await dbService.updateProductInList(productToSubmit, listId);
    } else {
      await dbService.addProductToList(productToSubmit, listId);
    }

    await dbService.addProduct(JSON.parse(JSON.stringify(productToSubmit)));
    await productsStore.loadFromDB(listId);
    await updateAll();
    resetForm();
    notify({message: props.isEdit ? 'Продукт обновлён' : 'Добавлено успешно', color: 'success'});

    showModal.value = false;
  } catch (error) {
    console.error("Ошибка при сохранении продукта:", error);
    notify({message: 'Ошибка при сохранении продукта', color: 'danger'});
  }
};


const resetForm = () => {
  newProductName.value = '';
  selectedProductId.value = null;
  quantity.value = 1;
  selectedUnitId.value = null;
  selectedCategoryId.value = null;
  selectedParentCategoryId.value = null;
};

async function updateAll() {
  products.value = await dbService.getAllProductsForSelect();
  categories.value = await dbService.getAllCategories()
  // products.value = productsStore.activeProducts;
  // console.log(products.value, route.params.id);
  // products.value = await dbService.getAllProductsForSelect();
  units.value = await dbService.getAllUnits();
  // console.log(units.value);
}

// const parentCategories = computed(() =>
//     categories.value.filter(category => category.parentId === null)
// );

const childCategories = computed(() =>
    categories.value.filter(category => category.parentId === selectedParentCategoryId.value)
);


watch(selectedProductId, async (newId) => {
  if (newId) {
    const product = products.value.find(p => p.id === newId);
    if (product?.unit) {
      selectedUnitId.value = product.unit.id;
    }

    if (product?.categoryId) {
      const selectedCategory = categories.value.find(c => c.id === product.categoryId);
      if (selectedCategory) {
        if (selectedCategory.parentId === null) {
          selectedParentCategoryId.value = selectedCategory.id;
          selectedCategoryId.value = null;
        } else {
          selectedParentCategoryId.value = selectedCategory.parentId ?? null;
          await nextTick();
          selectedCategoryId.value = selectedCategory.id;
        }
      }
    } else {
      selectedParentCategoryId.value = null;
      selectedCategoryId.value = null;
    }
  } else {
    selectedUnitId.value = null;
    selectedParentCategoryId.value = null;
    selectedCategoryId.value = null;
  }
});


watch(() => props.editableProduct, (newProduct) => {
  if (showModal.value && newProduct) {
    editProduct();
  } else if (showModal.value && !newProduct) {

    resetForm();

  }
});
watch(selectedParentCategoryId, () => {
  selectedCategoryId.value = null;
});

onBeforeMount(async () => {
  await updateAll();
});
</script>

<style lang="scss" scoped>

.input-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.btn-container {
  display: flex;
  margin-top: 10px;
  justify-content: flex-end;
}

.mb-4 {
  margin-bottom: 1rem;
}

.count-container {
  display: flex;
  gap: 10px;
}
</style>