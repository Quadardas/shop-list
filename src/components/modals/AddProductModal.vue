<template>
  <VaButton @click="showModal = !showModal">
    Добавить продукты
  </VaButton>

  <VaModal
      v-model="showModal"
      no-outside-dismiss
      ok-text="Добавить"

      cancel-text="Отмена"
  >
    <h3 class="va-h3">
      <VaSelect
          autocomplete
          v-model:search="autoCompleteSearchValue"
          v-model="selectedProduct"
          :options="products"
          value-by="id"
          text-by="name"
          allow-create
          @create-new="handleNewProduct"
          label="Продукт"
      />
      <VaCounter
          v-model="count"
          label="Количество"
          manual-input
      />
    </h3>
  </VaModal>
</template>

<script lang="ts" setup>
import {onMounted, reactive, ref} from "vue";
import {VaButton, VaCounter, VaForm, VaModal, VaSelect} from 'vuestic-ui';
import type {IProduct} from "@/models/product.model.ts";
import {dbService} from "@/components/services/DB.service.ts";

const showModal = ref(false);

const products = ref<IProduct[]>([]);
const count = ref(1);
const autoCompleteSearchValue = ref('');
// const selectedProduct = ref<string | null>(null);
const selectedProduct = ref<number | null>();

// const newProducts = ref<{ value: string; text: string }[]>([]);

const handleNewProduct = async (newProductName: string) => {

  const newProduct: IProduct = {
    id: 0,
    name: newProductName,
    count: count.value,
    bought: false
  };

  products.value.push(newProduct);
  selectedProduct.value = newProduct.id;

  await dbService.addProduct(newProduct);
  console.log(newProduct);
};


onMounted(async () => {
  products.value = await dbService.getAllProductsForSelect();
  // newProducts.value = products.value.map(product => ({
  //   value: String(product.id),
  //   text: product.name
  // }));
  // console.log(newProducts.value);
});
</script>