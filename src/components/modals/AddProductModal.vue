<template>
  <VaButton @click="showModal = !showModal">
    Добавить продукты
  </VaButton>

  <VaModal
      no-dismiss
      v-model="showModal"
      hideDefaultActions
      cancel-text="Отмена"
      @cancel="resetForm"
  >
    <div class="container">
      <div class="input-container">
        <VaInput
            v-model="maskedValue"
            placeholder="Введите название нового продукта"
            label="Новый продукт"
            strict-bind-input-value
            :rules="[(value) => value.length <= 20 || 'Макс. 20 символов']"
        />

        <VaSelect
            v-model="selectedProductId"
            clearable
            searchable
            :options="products"
            value-by="id"
            text-by="name"
            label="или выберите из списка"

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
      <VaButton @click="handleSubmit">
        Добавить продукты
      </VaButton>
    </div>

  </VaModal>
</template>

<script lang="ts" setup>
import {computed, onMounted, ref, watch} from "vue";
import {useToast, VaButton, VaCounter, VaInput, VaModal, VaSelect} from 'vuestic-ui';
import type {IProduct} from "@/models/product.model.ts";
import {dbService} from "@/components/services/DB.service.ts";
import {useProductsStore} from "@/stores/products.ts";
import type {IUnit} from "@/models/unit.model.ts";
import {useRoute} from "vue-router";

const {init, notify, close, closeAll} = useToast()

const showModal = ref(false);
const products = ref<IProduct[]>([]);
const units = ref<IUnit[]>([]);
const quantity = ref(1);
const newProductName = ref('');
const selectedProductId = ref<number | null>(null);
const selectedUnitId = ref<number | null>(null);
const productsStore = useProductsStore();
const listName = ref<string>('')
const route = useRoute()

const maskedValue = computed({
  get() {
    return newProductName.value
  },
  set(v) {
    newProductName.value = v.slice(0, 20)
  }
})


const addNewUnit = async (newUnitName: string) => {
  const unitToAdd = {
    id: Date.now(),
    name: newUnitName,
  };

  await dbService.addUnit(unitToAdd);
  units.value = [...units.value, unitToAdd];
  selectedUnitId.value = unitToAdd.id;
};

const handleSubmit = async () => {
  if (!maskedValue.value && !selectedProductId.value) {
    notify({message: 'Введите название или выберите из списка', color: 'danger'});
    return;
  }
  if (selectedUnitId.value == null) {
    notify({message: 'Введите единицу измерения', color: 'danger'})
    return;
  }

  let productToAdd: IProduct;

  if (selectedProductId.value) {
    const existingProduct = products.value.find(p => p.id === selectedProductId.value);
    if (!existingProduct) return;

    productToAdd = {
      ...existingProduct,
      count: quantity.value,
    };
  } else {
    const unitObj = units.value.find(u => u.id === selectedUnitId.value);

    productToAdd = {
      id: Date.now(),
      name: maskedValue.value,
      count: quantity.value,
      bought: false,
      unit: unitObj
    };
    // console.log(productToAdd);
  }

  try {
    // productsStore.addProduct(productToAdd);
    // await dbService.addProduct(productToAdd);
    await dbService.addProductToList(productToAdd, +route.params.id);
    await productsStore.loadFromDB(+route.params.id);
    await updateAll();
    resetForm();
    notify({message: 'Добавлено успешно', color: 'success'});
  } catch (error) {
    console.error("Ошибка при добавлении продукта:", error);
    notify({message: 'Ошибка при добавлении продукта'});
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
  units.value = await dbService.getAllUnits();
  // console.log(units.value);
}

watch(selectedProductId, (newId) => {
  if (newId) {
    const product = products.value.find(p => p.id === newId);
    if (product?.unit) {
      selectedUnitId.value = product.unit;
    }
  } else {
    selectedUnitId.value = null;
  }
});

onMounted(async () => {
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