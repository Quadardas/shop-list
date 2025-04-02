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
        Список покупок
      </VaNavbarItem>
      <VaNavbarItem class="hidden sm:block">
        Список всех покупок
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
}

</style>