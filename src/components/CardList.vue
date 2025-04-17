<template>
  <div class="header">
    <CreateNewListModal
        @confirm="createNewList"
    />
    <VaInput
        v-model="searchQuery"
        class="ml-4"
        placeholder="Поиск "
        clearable
    />
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
      <VaButton
          @click.stop="showDeleteConfirmation(card.id)"
          preset="secondary">Удалить
      </VaButton>
    </VaCard>
    <confirm-modal
        ref="confirmModal"
        @confirm="deleteCard(selectedCardId)"
    ></confirm-modal>
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
import {sortListStrategies} from "@/utils/sort.ts";
import ConfirmModal from "@/components/modals/ConfirmModal.vue";

const productsStore = useProductsStore();
const router = useRouter()
const route = useRoute()
const cardsList = ref<IList[]>([])
const selectedSortOption = ref<string>('По умолчанию')
const selectedSortType = ref<string>('По убыванию')
const confirmModal = ref<InstanceType<typeof ConfirmModal> | null>(null)
const selectedCardId = ref<number | null>(null)
const searchQuery = ref<string>('');

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
    router.push(`/one-card/${id}`)
  }
}

async function createNewList(name: string) {
  await dbService.createList(name)
  await updateAll()
}

function showDeleteConfirmation(id: number) {
  selectedCardId.value = id
  confirmModal.value?.show()
}

async function deleteCard(id: number) {
  await dbService.deleteList(id)
  await updateAll()
}


async function updateAll() {
  cardsList.value = await dbService.getAllLists()
}

const sortedProducts = computed(() => {
  const option = selectedSortOption.value;
  const type = selectedSortType.value;
  const lists = cardsList.value;

  const filtered = lists.filter(list =>
      list.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );

  const strategy = sortListStrategies[option];
  return strategy ? strategy(filtered, type) : lists;
});

onMounted(async () => {
  await updateAll()
})

</script>

<style lang="scss">
.header {
  display: flex;

  input {
    height: 80%;
  }
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