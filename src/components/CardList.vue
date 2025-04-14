<template>
  <VaCard v-for="card in cardsList" :key="card.id"
          @click="goToCard(card.id)"
  >
    <VaCardTitle>
      {{ card.name }}
    </VaCardTitle>
    <VaCardContent>
      Количество товаров: {{ card.products.length }}
    </VaCardContent>
  </VaCard>
  <VaButton
      class="mt-4 ml-4"
      @click="createNewList">
    Создать список
  </VaButton>
</template>
<script lang="ts" setup>
import {VaButton, VaCard, VaCardContent, VaCardTitle} from "vuestic-ui";
import {useRoute, useRouter} from "vue-router";
import {onBeforeMount, onMounted, ref} from "vue";
import type {IList} from "@/models/list.model.ts";
import {dbService} from "@/components/services/DB.service.ts";
import ShoppingList from "@/components/ShoppingList.vue";
import OneCard from "@/components/OneCard.vue";
import {useProductsStore} from "@/stores/products.ts";

const productsStore = useProductsStore();

const router = useRouter()
const route = useRoute()
const cardsList = ref<IList[]>([])

function goToCard(id: number) {
  const selectedList = cardsList.value.find(list => list.id === id)
  if (selectedList) {
    productsStore.activeProducts = selectedList.products
    router.push(`/one-card/${id}`)
  }
}

function createNewList() {
  console.log('aboba')
}


onMounted(async () => {
  cardsList.value = await dbService.getAllLists()
  // console.log(cardsList.value)
})

</script>