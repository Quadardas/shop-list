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
            v-if="isEdit"
            v-model="selectedCategoryId"
            label="Подкатегория"
            :options="childCategories"
            value-by="id"
            text-by="name"
            clearable
            allow-create="unique"
            @create-new="addNewCategory"
        />

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
const newCategoryName = ref('');
const newSubCategoryName = ref('');
const selectedParentCategoryId = ref<number | null>(null);
const selectedProductId = ref<number | null>(null);
const selectedCategoryId = ref<number | null>(null);
const selectedUnitId = ref<number | null>(null);
const productsStore = useProductsStore();
const route = useRoute()
const props = defineProps<{
  editableCategory: ICategory | null;
  isEdit: boolean;
  parentCategoryId: number | null;
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

const maskedValue = computed({
  get() {
    return newCategoryName.value
  },
  set(v) {
    newCategoryName.value = v.slice(0, 20)
  }
})

function editCategory() {
  if (!props.editableCategory) return;

  newCategoryName.value = props.editableCategory.name;

}


const addNewCategory = async (newCategoryNameRaw: string) => {
  const trimmedName = newCategoryNameRaw.slice(0, 20);

  const newCategory = {
    id: Date.now(),
    name: trimmedName,
    parentId: props.parentCategoryId || null,
  };
  try {
    await dbService.createCategory(newCategory.id, newCategory.name, newCategory.parentId);
    categories.value.push(newCategory);
    selectedParentCategoryId.value = newCategory.id;
    notify({message: 'Категория добавлена', color: 'success'});
  } catch (err) {
    notify({message: 'Ошибка при добавлении категории', color: 'danger'});
    console.error(err);
  }
  emit('close');
  showModal.value = false;
  resetForm()
};

const handleSubmit = async () => {
  const categoryId = selectedCategoryId.value || selectedParentCategoryId.value;

  if (!categoryId) {
    notify({message: 'Выберите категорию или подкатегорию', color: 'warning'});
    return;
  }

  try {
    notify({message: 'Категория выбрана', color: 'success'});

    emit('close');
    showModal.value = false;
    resetForm();
  } catch (err) {
    notify({message: 'Ошибка при выборе категории', color: 'danger'});
    console.error(err);
  }
};

const resetForm = () => {
  selectedCategoryId.value = null;
  selectedParentCategoryId.value = null;
};

async function updateAll() {
  products.value = await dbService.getAllProductsForSelect();
  categories.value = await dbService.getAllCategories()
  units.value = await dbService.getAllUnits();
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
    selectedParentCategoryId.value = null;
    selectedCategoryId.value = null;
  }
});


watch(() => props.editableCategory, (newProduct) => {
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
