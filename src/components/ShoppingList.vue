<template>
  <div class="container">
    <VaOptionList
        v-model="selectedProducts"
        :options="products"
        value-by="id"
        :text-by="(product) => `${product.name} (${product.count} шт.)`"
    />

    <div>Выбранные продукты:</div>
    <pre>{{ selectedProducts }}</pre>
  </div>
</template>

<script lang="ts" setup>
import {ref, onMounted} from 'vue'
import {VaOptionList} from "vuestic-ui"

const products = ref<any[]>([])
const selectedProducts = ref<number[]>([])
let db: IDBDatabase | null = null

// Инициализация IndexedDB
const initDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const openRequest = indexedDB.open("shoppingDB", 1)

    openRequest.onupgradeneeded = function () {
      const db = openRequest.result
      if (!db.objectStoreNames.contains('shopList')) {
        db.createObjectStore('shopList', {keyPath: 'id'})
      }
    }

    openRequest.onsuccess = function () {
      db = openRequest.result
      resolve(db)
    }

    openRequest.onerror = function () {
      reject(openRequest.error)
    }
  })
}

// Добавление продукта
const addProduct = async (product: IProduct) => {
  if (!db) return

  return new Promise<void>((resolve, reject) => {
    const transaction = db!.transaction("shopList", "readwrite")
    const shopList = transaction.objectStore("shopList")

    const request = shopList.add(product)

    request.onsuccess = function () {
      console.log("Продукт добавлен в хранилище")
      resolve()
    }

    request.onerror = function () {
      console.log("Ошибка", request.error)
      reject(request.error)
    }
  })
}

const getAllProducts = async () => {
  if (!db) return

  return new Promise<any[]>((resolve, reject) => {
    const transaction = db!.transaction("shopList", "readonly")
    const shopList = transaction.objectStore("shopList")
    const request = shopList.getAll()

    request.onsuccess = function () {
      resolve(request.result)
    }

    request.onerror = function () {
      reject(request.error)
    }
  })
}

onMounted(async () => {
  try {
    await initDB()

    const existingProducts = await getAllProducts()
    if (existingProducts.length === 0) {
      await addProduct({id: 1, name: 'Молоко', count: 15, bought: false})
      await addProduct({id: 2, name: 'Хлеб', count: 20, bought: false})
      await addProduct({id: 3, name: 'Яйца', count: 30, bought: false})
    }

    products.value = await getAllProducts()
  } catch (error) {
    console.error("Ошибка при работе с IndexedDB:", error)
  }
})
</script>

<style lang="scss" scoped>
.container {
  margin: 10px;
  padding: 10px;
}
</style>