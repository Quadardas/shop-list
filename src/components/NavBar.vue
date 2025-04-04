<template>
  <VaNavbar
      color="primary"
      class="mb-3"
  >
    <template #left>
      <VaNavbarItem class="logo">
        LOGO
      </VaNavbarItem>
    </template>
    <template #right>
      <VaNavbarItem class="hidden sm:block">
        <router-link to="/">Список покупок</router-link>
      </VaNavbarItem>
      <VaNavbarItem class="hidden sm:block">
        <router-link to="/product-list">Список всех товаров</router-link>
      </VaNavbarItem>
      <add-product-modal
      ></add-product-modal>
    </template>
  </VaNavbar>


</template>
<script lang="ts" setup>
import {VaNavbar, VaNavbarItem} from "vuestic-ui";
import AddProductModal from "@/components/modals/AddProductModal.vue";

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