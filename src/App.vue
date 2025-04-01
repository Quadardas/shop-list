<script lang="ts" setup>

import NavBar from "@/components/NavBar.vue";
import ShoppingList from "@/components/ShoppingList.vue";
import {onBeforeMount} from "vue";

// let shoppingList = [
//   {
//     "id": 1,
//     "name": "Молоко",
//     "count": 15,
//     "bought": false
//   },
//   {
//     "id": 2,
//     "name": "Хлеб",
//     "count": 20,
//     "bought": false
//   },
//   {
//     "id": 3,
//     "name": "Яйца",
//     "count": 30,
//     "bought": false
//   },
//   {
//     "id": 4,
//     "name": "Сахар",
//     "count": 10,
//     "bought": false
//   },
//   {
//     "id": 5,
//     "name": "Масло",
//     "count": 8,
//     "bought": false
//   },
//   {
//     "id": 6,
//     "name": "Сыр",
//     "count": 12,
//     "bought": false
//   },
//   {
//     "id": 7,
//     "name": "Кофе",
//     "count": 5,
//     "bought": false
//   },
//   {
//     "id": 8,
//     "name": "Чай",
//     "count": 7,
//     "bought": false
//   },
//   {
//     "id": 9,
//     "name": "Печенье",
//     "count": 25,
//     "bought": false
//   },
//   {
//     "id": 10,
//     "name": "Макароны",
//     "count": 18,
//     "bought": false
//   }
// ]
//
// onBeforeMount(() => {
//   localStorage.setItem("shoppingList", JSON.stringify(shoppingList))
// })

</script>

<template>
  <nav-bar/>
  <shopping-list/>
</template>

<style>

</style>