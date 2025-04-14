import {createRouter, createWebHistory} from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProductList from "@/components/ProductList.vue";
import ShoppingList from "@/components/ShoppingList.vue";
import CardList from "@/components/CardList.vue";
import OneCard from "@/components/OneCard.vue";


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // {
    //   path: '/',
    //   name: 'shoppingList',
    //   component: ShoppingList,
    // },
    {
      path: '/one-card/:id',
      name: 'one-card',
      component: OneCard,
    },
    {
      path: '/card-list',
      name: 'card-list',
      component: CardList,
    },
    {
      path: '/product-list',
      name: 'productList',
      component: ProductList,
    },
  ],
})

export default router
