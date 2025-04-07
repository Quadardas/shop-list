<template>
  <VaButton @click="showModal = !showModal">
    Добавить продукты
  </VaButton>

  <VaModal
      no-dismiss
      v-model="showModal"
      hideDefaultActions
      ok-text="Добавить"

      cancel-text="Отмена"
      @cancel="resetForm"
  >
    <div class="container">
      <div class="input-container">
        <VaInput
            v-model="maskedValue"
            placeholder="Введите название нового продукта"
            label="Новый продукт"
            maxlength="10"
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
      <VaCounter
          v-model="quantity"
          label="Количество"
          manual-input
          :min="1"
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
      <VaButton @click="handleSubmit">
        Добавить продукты
      </VaButton>
    </div>

  </VaModal>
</template>

<script lang="ts" setup>
import {computed, onMounted, ref} from "vue";
import {useToast, VaButton, VaCounter, VaInput, VaModal, VaSelect} from 'vuestic-ui';
import type {IProduct} from "@/models/product.model.ts";
import {dbService} from "@/components/services/DB.service.ts";
import {useProductsStore} from "@/stores/products.ts";

const {init, notify, close, closeAll} = useToast()

const showModal = ref(false);
const products = ref<IProduct[]>([]);
const quantity = ref(1);
const newProductName = ref('');
const selectedProductId = ref<number | null>(null);
const productsStore = useProductsStore();
const maskedValue = computed({
  get() {
    return newProductName.value
  },
  set(v) {
    newProductName.value = v.slice(0, 20)
  }
})

const handleSubmit = async () => {
  if (!maskedValue.value && !selectedProductId.value) {
    notify({message: 'Введите название или выберите из списка', color: 'warning'});
    return;
  }

  let productToAdd: IProduct;
  if (selectedProductId.value) {
    const existingProduct = products.value.find(p => p.id === selectedProductId.value);
    if (!existingProduct) return;

    productToAdd = {
      ...existingProduct,
      count: quantity.value
    };
  } else {
    productToAdd = {
      id: Date.now(),
      name: maskedValue.value,
      count: quantity.value,
      bought: false
    };
    await updateAll()
  }

  try {
    productsStore.addProduct(productToAdd);
    await dbService.addProduct(productToAdd);
    products.value = await dbService.getAllProductsForSelect();
    resetForm();
    notify({message: 'Добавлено успешно', color: "success"});
    // showModal.value = false;
  } catch (error) {
    console.error("Ошибка при добавлении продукта:", error);
    notify({message: 'Ошибка при добавлении продукта'})
  }
};


const resetForm = () => {
  newProductName.value = '';
  selectedProductId.value = null;
  quantity.value = 1;
};

async function updateAll() {
  products.value = await dbService.getAllProductsForSelect();
}

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

  .divider {
    text-align: center;
    color: var(--va-secondary);
    font-weight: bold;
    margin: 8px 0;
  }
}

.btn-container {
  display: flex;
  margin-top: 10px;
  justify-content: flex-end;
}

.mb-4 {
  margin-bottom: 1rem;
}
</style>