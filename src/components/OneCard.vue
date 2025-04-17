<template>
  <shopping-list
      :isArchive="route.query.archive === 'true'"/>
</template>

<script lang="ts" setup>
import ShoppingList from '@/components/ShoppingList.vue'
import {useRoute} from 'vue-router'

const route = useRoute()
</script>
