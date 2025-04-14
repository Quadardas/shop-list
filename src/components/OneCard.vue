<template>
  <shopping-list
  ></shopping-list>
</template>
<script lang="ts" setup>
import {VaCard, VaCardContent, VaCardTitle} from "vuestic-ui";
import {useRoute, useRouter} from "vue-router";
import {onBeforeMount, onMounted, ref} from "vue";
import type {IList} from "@/models/list.model.ts";
import {dbService} from "@/components/services/DB.service.ts";
import ShoppingList from "@/components/ShoppingList.vue";


const cardsList = ref<IList[]>([])

onBeforeMount(async () => {
  // cardsList.value = await dbService.getAllLists()
  // console.log(cardsList.value)
})

</script>