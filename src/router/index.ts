import {createRouter, createWebHistory} from 'vue-router'
import ProductList from "@/components/ProductList.vue";
import CardList from "@/components/CardList.vue";
import OneCard from "@/components/OneCard.vue";
import Archive from "@/components/Archive.vue";


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/card-list',
    },
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
    {
      path: '/archive',
      name: 'archiveList',
      component: Archive,
    },
  ],
})

export default router
