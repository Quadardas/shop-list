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
              v-model="newCategoryName"
              label="Название категории"
              :rules="[(v) => !!v || 'Введите название']"
              maxlength="20"
          />
        </div>

        <VaSelect
            v-model="selectedParentCategoryId"
            label="Родительская категория"
            :options="categories"
            value-by="id"
            text-by="name"
            clearable
            allow-create="unique"
            @create-new="addNewCategory"
        />

<!--        <VaSelect-->
<!--            v-if="isEdit"-->
<!--            v-model="selectedCategoryId"-->
<!--            label="Подкатегория"-->
<!--            :options="childCategories"-->
<!--            value-by="id"-->
<!--            text-by="name"-->
<!--            clearable-->
<!--            allow-create="unique"-->
<!--            @create-new="addNewCategory"-->
<!--        />-->
      </div>

      <div class="btn-container">
        <VaButton
            preset="secondary"
            @click="() => {
              resetForm();
              showModal = false;
            }">
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
import {computed, nextTick, onBeforeMount, ref, watch} from "vue";
import {useToast, VaButton, VaInput, VaModal, VaSelect} from 'vuestic-ui';
import type {IProduct} from "@/models/product.model.ts";
import type {IUnit} from "@/models/unit.model.ts";
import type {ICategory} from "@/models/category.model.ts";
import {dbService} from "@/components/services/DB.service.ts";
import {useProductsStore} from "@/stores/products.ts";
import {useRoute} from "vue-router";

const {notify} = useToast();
const showModal = ref(false);
const products = ref<IProduct[]>([]);
const categories = ref<ICategory[]>([]);
const units = ref<IUnit[]>([]);
const quantity = ref(1);

const newCategoryName = ref('');
const selectedParentCategoryId = ref<number | null>(null);
const selectedProductId = ref<number | null>(null);
const selectedCategoryId = ref<number | null>(null);
const selectedUnitId = ref<number | null>(null);

const productsStore = useProductsStore();
const route = useRoute();

const props = defineProps<{
  editableCategory: ICategory | null;
  isEdit: boolean;
  parentCategoryId: number | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

defineExpose({
  show: () => {
    showModal.value = true;
    if (props.isEdit && props.editableCategory) {
      editCategory();
    } else {
      resetForm();
    }
  },
  hide: () => {
    showModal.value = false;
    emit('close');
  }
});

const childCategories = computed(() =>
    categories.value.filter(category => category.parentId === selectedParentCategoryId.value)
);

watch(() => props.editableCategory, (newVal) => {
  if (showModal.value && newVal) {
    editCategory();
  } else if (showModal.value && !newVal) {
    resetForm();
  }
});

watch(selectedParentCategoryId, () => {
  if (!props.isEdit) {
    selectedCategoryId.value = null;
  }
});

async function updateAll() {
  products.value = await dbService.getAllProductsForSelect();
  categories.value = await dbService.getAllCategories();
  units.value = await dbService.getAllUnits();
}

const resetForm = () => {
  selectedCategoryId.value = null;
  selectedParentCategoryId.value = null;
  newCategoryName.value = '';
};

const editCategory = () => {
  if (!props.editableCategory) return;

  newCategoryName.value = props.editableCategory.name;

  if (props.editableCategory.parentId === null) {
    selectedParentCategoryId.value = props.editableCategory.id;
    selectedCategoryId.value = null;
  } else {
    selectedParentCategoryId.value = props.editableCategory.parentId;
    selectedCategoryId.value = props.editableCategory.id;
  }
};

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
  resetForm();
};

const handleSubmit = async () => {
  const categoryId = selectedCategoryId.value || selectedParentCategoryId.value;

  if (!categoryId) {
    notify({message: 'Выберите категорию или подкатегорию', color: 'warning'});
    return;
  }

  if (props.isEdit && props.editableCategory) {
    const category = categories.value.find(c => c.id === props.editableCategory?.id);
    if (category) {
      category.name = newCategoryName.value.trim().slice(0, 20);
      category.parentId = selectedParentCategoryId.value ?? null;
      try {
        await dbService.editCategory(category.id, category.name, category.parentId);
        notify({message: 'Категория обновлена', color: 'success'});
      } catch (err) {
        notify({message: 'Ошибка при обновлении категории', color: 'danger'});
        console.error(err);
      }
    }
  } else {
    notify({message: 'Категория выбрана', color: 'success'});
  }

  emit('close');
  showModal.value = false;
  resetForm();
};

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
</style>
