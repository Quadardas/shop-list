import type {IProduct} from "@/models/product.model.ts"
import {useToast} from "vuestic-ui";
import type {IUnit} from "@/models/unit.model.ts";
import type {IList} from "@/models/list.model";


class DBService {
  private db: IDBDatabase | null = null;
  private readonly dbName = "shoppingDB";
  private readonly storeName = "shopList";
  private readonly secondStoreName = "allProducts";
  private readonly unitsStoreName = "units";
  private readonly cardList = "cardList";
  private readonly dbVersion = 5;


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
        if (!db.objectStoreNames.contains(this.cardList)) {
          db.createObjectStore(this.cardList, {keyPath: 'id'});
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
      const transaction = this.db?.transaction(
        [this.storeName, this.secondStoreName, this.unitsStoreName],
        "readonly"
      );

      const shopList = transaction?.objectStore(this.storeName);
      const productStore = transaction?.objectStore(this.secondStoreName);
      const transactionUnits = transaction?.objectStore(this.unitsStoreName);

      const productsRequest = productStore?.getAll();
      const shopItemsRequest = shopList?.getAll();
      const allUnitsRequest = transactionUnits?.getAll();

      const getAllPromise = (request: IDBRequest<any>) =>
        new Promise<any>((res, rej) => {
          request.onsuccess = () => res(request.result);
          request.onerror = () => rej(request.error);
        });
      if (!productsRequest || !shopItemsRequest || !allUnitsRequest) {
        reject()
      } else
        Promise.all([
          getAllPromise(productsRequest),
          getAllPromise(shopItemsRequest),
          getAllPromise(allUnitsRequest)
        ])
          .then(([productRecords, shopItems, units]) => {
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
                    bought: shopItem.bought,
                    unit: units.find(unit => unit.id === product.unit),
                  }
                  : null;
              })
              .filter(Boolean) as IProduct[];

            resolve(products);
          })
          .catch(reject);
    });
  }

  public async createList(listName: string): Promise<IList> {
    if (!this.db) await this.initDB();

    return new Promise<IList>((resolve, reject) => {
      const transaction = this.db!.transaction(this.cardList, "readwrite");
      const cardListStore = transaction.objectStore(this.cardList);

      const newList = {
        name: listName,
        id: Date.now(),
        products: [],
        dateCreate: Date.now(),
      }
      const request = cardListStore.add(newList);

      request.onsuccess = () => {
        resolve(newList);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  public async getOneList(listID: number): Promise<IList> {
    if (!this.db) await this.initDB();
    return new Promise<IList>((resolve, reject) => {
      const transaction = this.db!.transaction(this.cardList, "readwrite");
      const cardListStore = transaction.objectStore(this.cardList);
      const request = cardListStore.get(listID);
      request.onsuccess = () => {
        resolve(request.result);
      }
      request.onerror = () => {
        reject(request.error);
      }
    })
  }

  public async deleteList(listID: number): Promise<IList> {
    if (!this.db) await this.initDB();
    return new Promise<IList>((resolve, reject) => {
      const transaction = this.db!.transaction(this.cardList, "readwrite");
      const cardListStore = transaction.objectStore(this.cardList);
      const request = cardListStore.delete(listID);
      request.onsuccess = () => {
        resolve(request.result);

      }
      request.onerror = () => {
        reject(request.error);
      }

    })
  }

  public async getAllLists(): Promise<IList[]> {
    if (!this.db) await this.initDB();

    return new Promise<IList[]>((resolve, reject) => {
      const transaction = this.db!.transaction(this.cardList, "readwrite");
      const cardListStore = transaction.objectStore(this.cardList);
      const request = cardListStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    })
  }

  public async getProductsFromListById(listId: number): Promise<IProduct[]> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error("База данных не инициализирована");

    return new Promise<IProduct[]>((resolve, reject) => {
      const transaction = this.db!.transaction(this.cardList, "readonly");
      const listStore = transaction.objectStore(this.cardList);
      const request = listStore.get(listId);

      request.onsuccess = () => {
        const list: IList = request.result;
        if (!list || !Array.isArray(list.products)) {
          resolve([]);
        } else {
          resolve(list.products);
        }
      };

      request.onerror = () => reject(request.error);
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

  public async addProductToList(product: IProduct, listId: number): Promise<void> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error("База данных не инициализирована");

    const listTransaction = this.db.transaction([this.cardList], "readwrite");
    const listStore = listTransaction.objectStore(this.cardList);

    const list: IList = await new Promise((resolve, reject) => {
      const request = listStore.get(listId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (!list) throw new Error(`Список с id ${listId} не найден`);

    if (!Array.isArray(list.products)) {
      list.products = [];
    }

    const productId = product.id && product.id !== 0 ? product.id : Date.now();
    const existingProductIndex = list.products.findIndex(p => p.id === productId);

    if (existingProductIndex !== -1) {
      list.products[existingProductIndex].count += product.count;
      list.products[existingProductIndex].bought = product.bought ?? false;
    } else {
      list.products.push({
        id: productId,
        name: product.name,
        count: product.count,
        bought: product.bought ?? false,
        unit: {
          id: product.unit?.id,
          name: product.unit?.name,
        }
      });

    }

    await new Promise<void>((resolve, reject) => {
      const request = listStore.put(list);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    await new Promise<void>((resolve, reject) => {
      listTransaction.oncomplete = () => resolve();
      listTransaction.onerror = () => reject(listTransaction.error);
      listTransaction.onabort = () => reject(listTransaction.error);
    });
  }

  public async updateProductBoughtStatus(listId: number, productId: number, bought: boolean): Promise<void> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error("База данных не инициализирована");

    const transaction = this.db.transaction([this.cardList], "readwrite");
    const store = transaction.objectStore(this.cardList);

    const list: IList = await new Promise((resolve, reject) => {
      const request = store.get(listId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!list) throw new Error(`Список с id ${listId} не найден`);

    const productIndex = list.products.findIndex(p => p.id === productId);
    if (productIndex === -1) throw new Error(`Продукт с id ${productId} не найден в списке`);

    list.products[productIndex].bought = bought;

    await new Promise<void>((resolve, reject) => {
      const request = store.put(list);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }


  public async addProduct(product: IProduct): Promise<void> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error("База данных не инициализирована");

    const productId = product.id && product.id !== 0 ? product.id : Date.now();
    let existingProduct: IProduct | undefined;

    const productTransaction = this.db.transaction([this.secondStoreName], "readwrite");
    const productStore = productTransaction.objectStore(this.secondStoreName);

    if (!productStore) {
      throw new Error("Хранилище продуктов не найдено");
    }

    if (!product.id || product.id === 0) {
      const allProducts: IProduct[] = await new Promise((resolve, reject) => {
        const request = productStore.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      existingProduct = allProducts.find(p => p.name === product.name);
    } else {
      existingProduct = await new Promise<IProduct>((resolve, reject) => {
        const request = productStore.get(product.id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    if (!existingProduct) {
      await new Promise<void>((resolve, reject) => {
        const request = productStore.put({
          id: productId,
          name: product.name,
          
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    await new Promise<void>((resolve, reject) => {
      productTransaction.oncomplete = () => resolve();
      productTransaction.onerror = () => reject(productTransaction.error);
      productTransaction.onabort = () => reject(productTransaction.error);
    });

    const shopTransaction = this.db.transaction([this.storeName], "readwrite");
    const shopList = shopTransaction.objectStore(this.storeName);

    if (!shopList) throw new Error("Хранилище списка покупок не найдено");

    let existingItem = await new Promise<IProduct>((resolve, reject) => {
      const request = shopList.get(productId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!existingItem) {
      existingItem = {
        id: productId,
        name: product.name,
        count: 0,
        bought: false,
      };
    }

    const newCount = existingItem.count + product.count;

    await new Promise<void>((resolve, reject) => {
      const request = shopList.put({
        id: productId,
        name: product.name,
        count: newCount,
        bought: existingItem?.bought ?? product.bought ?? false,
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async deleteAllProducts(listId: number): Promise<void> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error("База данных не инициализирована");

    const transaction = this.db.transaction([this.cardList], "readwrite");
    const listStore = transaction.objectStore(this.cardList);

    try {
      const list: any = await new Promise((resolve, reject) => {
        const request = listStore.get(listId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (!list) {
        throw new Error(`Список с id ${listId} не найден`);
      }
      list.products = [];
      await new Promise<void>((resolve, reject) => {
        const request = listStore.put(list);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

    } catch (error) {
      console.error('Ошибка при удалении всех продуктов:', error);
      throw error;
    }
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
    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(this.secondStoreName, "readwrite");
      const store = transaction.objectStore(this.secondStoreName);
      const request = store.delete(id);
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