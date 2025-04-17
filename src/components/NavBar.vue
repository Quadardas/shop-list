<template>
  <VaNavbar
      color="primary"
      class="mb-3"
  >
    <template #left>
      <VaNavbarItem class="logo">
        ABOBA
      </VaNavbarItem>
    </template>
    <template #right>
      <VaNavbarItem class="hidden sm:block">
        <router-link to="/archive">Завершенные покупки</router-link>
      </VaNavbarItem>
      <VaNavbarItem class="hidden sm:block">
        <router-link to="/card-list">Активные списки</router-link>
      </VaNavbarItem>
      <VaNavbarItem class="hidden sm:block">
        <router-link to="/product-list">Список всех товаров</router-link>
      </VaNavbarItem>

    </template>
  </VaNavbar>


</template>
<script lang="ts" setup>
import {VaNavbar, VaNavbarItem} from "vuestic-ui";


</script>

<style lang="scss" scoped>
.logo {
  font-weight: 600;
  font-size: 1.5rem;
}

.hidden {
  cursor: pointer;

  a {
    color: white;
  }
}

</style>