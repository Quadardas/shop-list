import type {IProduct} from "@/models/product.model.ts"

class DBService {
  private db: IDBDatabase | null = null;
  private readonly dbName = "shoppingDB";
  private readonly storeName = "shopList";
  private readonly secondStoreName = "allProducts";
  private readonly dbVersion = 3;

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

    const transaction = this.db.transaction(
      [this.storeName, this.secondStoreName],
      "readwrite"
    );

    const shopList = transaction.objectStore(this.storeName);
    const productStore = transaction.objectStore(this.secondStoreName);

    let existingProduct: IProduct | undefined;
    if (product.id) {
      existingProduct = await new Promise<IProduct | undefined>((resolve) => {
        const request = productStore.get(product.id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(undefined);
      });
    }

    if (!existingProduct) {
      const newProductId = product.id || Date.now();


      const productForSecondStore = {
        id: newProductId,
        name: product.name
      };
      productStore.put(productForSecondStore);

      const productForFirstStore = {
        id: newProductId,
        count: product.count,
        bought: product.bought || false
      };
      shopList.put(productForFirstStore);
    } else {
      const existingShopItem = await new Promise<any>((resolve) => {
        const request = shopList.get(existingProduct!.id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(undefined);
      });

      if (existingShopItem.name === product.name) {
        existingShopItem.count += product.count;
        shopList.put(existingShopItem);
      } else {
        shopList.put({
          id: existingProduct.id,
          count: product.count,
          bought: product.bought || false
        });
      }
    }

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  public async updateProduct(product: IProduct): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, "readwrite");
      const shopList = transaction.objectStore(this.storeName);
      const productForFirstStore = {
        id: product.id,
        count: product.count,
        bought: product.bought || false
      };
      shopList.put(productForFirstStore);
      const request = shopList.put(productForFirstStore);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async deleteAll(): Promise<void> {
    if (!this.db) await this.initDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!
        .transaction(this.storeName, "readwrite")
        .objectStore(this.storeName).clear();
    });
  }
}


export const dbService = new DBService();