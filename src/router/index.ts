import {createRouter, createWebHistory} from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProductList from "@/components/ProductList.vue";
import ShoppingList from "@/components/ShoppingList.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'shoppingList',
      component: ShoppingList,
    },
    {
      path: '/product-list',
      name: 'productList',
      component: ProductList,
    },
  ],
})

export default router
