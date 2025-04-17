<template>
  <div class="header">
    <VaSelect
        class="ml-4 "
        :options="sortOptions"
        v-model="selectedSortOption"
        placement="right"
    />
    <VaSelect
        class="ml-4"
        :options="sortType"
        v-model="selectedSortType"
        placement="right"
    />
  </div>

  <div class="wrapper ml-4 mt-2">
    <VaCard
        v-for="card in sortedProducts" :key="card.id"
        @click="goToCard(card.id)"
    >
      <VaCardTitle>
        {{ card.name }}
      </VaCardTitle>
      <VaCardContent>
        Количество товаров: {{ card.products.length }}<br>
        Куплено: {{ card.products.filter(pr => pr.bought == true).length }}
      </VaCardContent>
    </VaCard>
  </div>

</template>
<script lang="ts" setup>
import {VaCard, VaCardContent, VaCardTitle, VaSelect} from "vuestic-ui";
import {useRoute, useRouter} from "vue-router";
import {computed, onMounted, ref} from "vue";
import type {IList} from "@/models/list.model.ts";
import {dbService} from "@/components/services/DB.service.ts";
import {useProductsStore} from "@/stores/products.ts";

import {sortListStrategies} from "@/utils/sort.ts";
import ConfirmModal from "@/components/modals/ConfirmModal.vue";

const productsStore = useProductsStore();
const router = useRouter()
const route = useRoute()
const cardsList = ref<IList[]>([])
const selectedSortOption = ref<string>('По умолчанию')
const selectedSortType = ref<string>('По убыванию')
const selectedCardId = ref<number | null>(null)
const sortOptions = [
  'По умолчанию',
  "По наименованию",
  "По дате создания"
]
const sortType = [
  "По убыванию",
  'По возрастанию',
]

function goToCard(id: number) {
  const selectedList = cardsList.value.find(list => list.id === id)
  if (selectedList) {
    productsStore.activeProducts = selectedList.products
    router.push(`/one-card/${id}?archive=true`)
  }
}

async function updateAll() {
  cardsList.value = await dbService.getAllListsFromArchive()
}

const sortedProducts = computed(() => {
  const option = selectedSortOption.value;
  const type = selectedSortType.value;
  const lists = cardsList.value;

  const strategy = sortListStrategies[option];
  return strategy ? strategy(lists, type) : lists;
});

onMounted(async () => {
  await updateAll()
})

</script>

<style lang="scss">
.header {
  display: flex;
}

.wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  .va-card {
    .va-card-title {
      font-size: 18px;
    }
  }
}

</style>