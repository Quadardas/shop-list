import {defineStore} from 'pinia';
import {dbService} from "@/components/services/DB.service.ts";
import type {IProduct} from '@/models/product.model';

export const useProductsStore = defineStore('products', {
  state: () => ({
    activeProducts: [] as IProduct[],
    isSyncing: false,
  }),

  actions: {
    async loadFromDB() {
      try {
        this.isSyncing = true;
        this.activeProducts = await dbService.getAllProducts();

      } catch (error) {
        console.error('Ошибка загрузки из DB:', error);
      } finally {
        this.isSyncing = false;
      }
    },

    async addProduct(product: IProduct) {
      const existing = this.activeProducts.find(p => p.id === product.id);
      if (existing) {
        existing.count += product.count;
      } else {
        this.activeProducts.push({
          ...product,
          id: product.id || Date.now()
        });
      }

      this.syncWithDB();
    },

    async syncWithDB() {
      if (this.isSyncing) return;

      try {
        this.isSyncing = true;
        const jija = JSON.parse(JSON.stringify(this.activeProducts));
        await dbService.saveAllProducts(jija);
      } catch (error) {
        console.error('Ошибка синхронизации:', error);
      } finally {
        this.isSyncing = false;
      }
    }
  }
});