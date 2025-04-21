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
              :options="products"
              value-by="id"
              text-by="name"
              label="Продукт"
              allow-create="unique"
              @create-new="addNewProduct"
          />
        </div>
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
import {computed, onBeforeMount, onMounted, ref, watch} from "vue";
import {useToast, VaButton, VaCounter, VaInput, VaModal, VaSelect} from 'vuestic-ui';
import type {IProduct} from "@/models/product.model.ts";
import {dbService} from "@/components/services/DB.service.ts";
import {useProductsStore} from "@/stores/products.ts";
import type {IUnit} from "@/models/unit.model.ts";
import {useRoute} from "vue-router";

const {notify} = useToast()

const showModal = ref(false);
const products = ref<IProduct[]>([]);
const units = ref<IUnit[]>([]);
const quantity = ref(1);
const newProductName = ref('');
const selectedProductId = ref<number | null>(null);
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

}

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
};

async function updateAll() {
  products.value = await dbService.getAllProductsForSelect();
  // products.value = productsStore.activeProducts;
  // console.log(products.value, route.params.id);
  // products.value = await dbService.getAllProductsForSelect();
  units.value = await dbService.getAllUnits();
  // console.log(units.value);
}

watch(selectedProductId, (newId) => {
  if (newId) {
    const product = products.value.find(p => p.id === newId);
    if (product?.unit) {
      selectedUnitId.value = product.unit.id;
    }
  } else {
    selectedUnitId.value = null;
  }
});

watch(() => props.editableProduct, (newProduct) => {
  if (showModal.value && newProduct) {
    editProduct();
  } else if (showModal.value && !newProduct) {

    resetForm();

  }
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