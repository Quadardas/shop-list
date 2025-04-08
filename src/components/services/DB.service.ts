import type {IProduct} from "@/models/product.model.ts"
import {useToast} from "vuestic-ui";
import type {IUnit} from "@/models/unit.model.ts";


class DBService {
  private db: IDBDatabase | null = null;
  private readonly dbName = "shoppingDB";
  private readonly storeName = "shopList";
  private readonly secondStoreName = "allProducts";
  private readonly unitsStoreName = "units";
  private readonly dbVersion = 4;


  public async initDB(): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const openRequest = indexedDB.open(this.dbName, this.dbVersion);

      openRequest.onupgradeneeded = () => {
        const db = openRequest.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, {keyPath: 'id'});
        }
        if (!db.objectStoreNames.contains(this.secondStoreName)) {
          db.createObjectStore(this.secondStoreName, {keyPath: 'id'});
        }
        if (!db.objectStoreNames.contains(this.unitsStoreName)) {
          db.createObjectStore(this.unitsStoreName, {keyPath: 'name'});
        }
      };

      openRequest.onsuccess = () => {
        this.db = openRequest.result;
        resolve(this.db);
      };

      openRequest.onerror = () => {
        reject(openRequest.error);
      };
    });
  }

  public async getAllProducts(): Promise<IProduct[]> {
    if (!this.db) await this.initDB();

    return new Promise<IProduct[]>((resolve, reject) => {
      const transaction = this.db.transaction(
        [this.storeName, this.secondStoreName],
        "readonly"
      );
      const shopList = transaction.objectStore(this.storeName);
      const productStore = transaction.objectStore(this.secondStoreName);

      const productsRequest = productStore.getAll();
      const shopItemsRequest = shopList.getAll();

      productsRequest.onsuccess = () => {
        const productRecords = productsRequest.result;

        shopItemsRequest.onsuccess = () => {
          const shopItems = shopItemsRequest.result;

          if (shopItems.length === 0) {
            return resolve([]);
          }

          const products: IProduct[] = productRecords
            .map(product => {
              const shopItem = shopItems.find(item => item.id === product.id);
              return shopItem
                ? {
                  id: product.id,
                  name: product.name,
                  count: shopItem.count,
                  bought: shopItem.bought
                }
                : null;
            })
            .filter(Boolean) as IProduct[];

          resolve(products);
        };
        shopItemsRequest.onerror = () => reject(shopItemsRequest.error);
      };
      productsRequest.onerror = () => reject(productsRequest.error);
    });
  }

  public async getAllProductsForSelect(): Promise<IProduct[]> {
    if (!this.db) await this.initDB();

    return new Promise<IProduct[]>((resolve, reject) => {
      const transaction = this.db!.transaction(this.secondStoreName, "readonly");
      const shopList = transaction.objectStore(this.secondStoreName);
      const request = shopList.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async addProduct(product: IProduct): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise<void>(async (resolve, reject) => {
      try {
        const transaction = this.db.transaction(
          [this.storeName, this.secondStoreName],
          "readwrite"
        );
        const shopList = transaction.objectStore(this.storeName);
        const productStore = transaction.objectStore(this.secondStoreName);

        let productId = product.id && product.id !== 0 ? product.id : Date.now();
        let existingProduct: IProduct | undefined = undefined;

        if (!product.id || product.id === 0) {

          const request = productStore.getAll();
          const allProducts = await new Promise<IProduct[]>((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });

          existingProduct = allProducts.find(p => p.name === product.name);
        } else {
          const request = productStore.get(product.id);
          existingProduct = await new Promise<IProduct | undefined>((resolve) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(undefined);
          });
        }

        if (!existingProduct) {
          await new Promise<void>((res, rej) => {
            const request = productStore.put({
              id: productId,
              name: product.name,
              unit: product.unit,
            });
            request.onsuccess = () => res();
            request.onerror = () => rej(request.error);
          });
        } else {
          productId = existingProduct.id;
        }

        const existingShopItem = await new Promise<any>((resolve) => {
          const request = shopList.get(productId);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(undefined);
        });

        if (existingShopItem) {
          existingShopItem.count += product.count;
          existingShopItem.bought = product.bought || existingShopItem.bought;

          await new Promise<void>((res, rej) => {
            const request = shopList.put({
              id: existingShopItem.id,
              name: existingShopItem.name,
              count: existingShopItem.count,
              bought: existingShopItem.bought,
            });
            request.onsuccess = () => res();
            request.onerror = () => rej(request.error);
          });
        } else {
          await new Promise<void>((res, rej) => {
            const request = shopList.put({
              id: productId,
              name: product.name,
              count: product.count,
              bought: product.bought || false
            });
            request.onsuccess = () => res();
            request.onerror = () => rej(request.error);
          });
        }

        transaction.oncomplete = () => resolve();
        transaction.onerror = (event) => reject((event.target as IDBRequest).error);
      } catch (error) {
        reject(error);
      }
    });
  }

  public async saveAllProducts(products: IProduct[]): Promise<void> {
    if (!this.db) await this.initDB();
    const transaction = this.db!.transaction(this.storeName, "readwrite");
    const shopList = transaction.objectStore(this.storeName);
    try {
      await new Promise<void>((resolve, reject) => {
        const clearRequest = shopList.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      });

      await Promise.all(products.map(product => {
        return new Promise<void>((resolve, reject) => {
          const request = shopList.put(product);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }));
    } catch (error) {
      console.error('Ошибка при сохранении продуктов:', error);
      throw error;

    }
  }

  public async deleteOneProduct(id: number): Promise<void> {
    if (!this.db) await this.initDB();
    console.log(id)
    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(this.secondStoreName, "readwrite");
      const store = transaction.objectStore(this.secondStoreName);
      console.log("Удаляем продукт с id:", id, "и тип:", typeof id);
      const request = store.delete(id);
      console.log(request);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async getAllUnits(): Promise<IUnit[]> {
    if (!this.db) await this.initDB();

    return new Promise<IUnit[]>((resolve, reject) => {
      const transaction = this.db!.transaction(this.unitsStoreName, "readonly");
      const store = transaction.objectStore(this.unitsStoreName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }


  public async addUnit(unit: IUnit): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(this.unitsStoreName, "readwrite");
      const store = transaction.objectStore(this.unitsStoreName);
      const request = store.put(unit);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }


}


export const dbService = new DBService();