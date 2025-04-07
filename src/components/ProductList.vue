<template>
  <div class="container">
    <VaList>
      <VaListItem v-for="product in products" :key="product.id">
        <VaListItemSection>
          <VaListItemLabel>{{ product.name }}</VaListItemLabel>
          <VaListItemLabel caption>
            <VaButton
                preset="secondary"
                @click="deleteOneProduct(product.id)"
            >Удалить
            </VaButton>
          </VaListItemLabel>
        </VaListItemSection>
      </VaListItem>
    </VaList>
  </div>
</template>
<script lang="ts" setup>

import {VaButton, VaList, VaListItem, VaListItemLabel, VaListItemSection} from "vuestic-ui";
import {onMounted, ref} from "vue";
import type {IProduct} from "@/models/product.model.ts";
import {dbService} from "@/components/services/DB.service.ts";

const products = ref<IProduct[]>([])

async function deleteOneProduct(id: number) {
  await dbService.deleteOneProduct(id);
  products.value = await dbService.getAllProductsForSelect();

}

onMounted(async () => {
  products.value = await dbService.getAllProductsForSelect()
})
</script>
<style lang="scss" scoped>
.container {
  margin: 10px;

  .va-list-item {
    font-size: 20px;
  }
}
</style>