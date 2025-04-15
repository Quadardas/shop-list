<template>
  <div class="header">
    <CreateNewListModal
        @confirm="createNewList"
    />
    <VaSelect
        class="ml-4 "
        :options="sortOptions"
        v-model="selectedSortOption"
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
        Количество товаров: {{ card.products.length }}
      </VaCardContent>
      <VaButton
          @click.stop="deleteCard(card.id)"
          preset="secondary">Удалить
      </VaButton>
    </VaCard>
  </div>

</template>
<script lang="ts" setup>
import {VaButton, VaCard, VaCardContent, VaCardTitle, VaSelect} from "vuestic-ui";
import {useRoute, useRouter} from "vue-router";
import {computed, onMounted, ref} from "vue";
import type {IList} from "@/models/list.model.ts";
import {dbService} from "@/components/services/DB.service.ts";
import {useProductsStore} from "@/stores/products.ts";
import CreateNewListModal from "@/components/modals/CreateNewListModal.vue";

const productsStore = useProductsStore();
const router = useRouter()
const route = useRoute()
const cardsList = ref<IList[]>([])
const selectedSortOption = ref<string>('По умолчанию')
const sortOptions = [
  'По умолчанию',
  "По наименованию",
  "По дате создания"
]

function goToCard(id: number) {
  const selectedList = cardsList.value.find(list => list.id === id)
  if (selectedList) {
    productsStore.activeProducts = selectedList.products
    router.push(`/one-card/${id}`)
  }
}

async function createNewList(name: string) {
  await dbService.createList(name)
  await updateAll()
}

async function deleteCard(id: number) {
  await dbService.deleteList(id)
  await updateAll()
}


async function updateAll() {
  cardsList.value = await dbService.getAllLists()
}

const sortedProducts = computed(() => {
  let result = [...cardsList.value];

  switch (selectedSortOption.value) {
    case 'По умолчанию':
      return result;
    case "По наименованию":
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "По дате создания":
      result.sort((a, b) => Number(a.dateCreate) - Number(b.dateCreate));
      break;
  }

  return result;
})

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