import type {IProduct} from "@/models/product.model.ts"

class DBService {
    private db: IDBDatabase | null = null;
    private readonly dbName = "shoppingDB";
    private readonly storeName = "shopList";
    private readonly dbVersion = 1;

    public async initDB(): Promise<IDBDatabase> {
        return new Promise<IDBDatabase>((resolve, reject) => {
            const openRequest = indexedDB.open(this.dbName, this.dbVersion);

            openRequest.onupgradeneeded = () => {
                const db = openRequest.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, {keyPath: 'id'});
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
            const transaction = this.db!.transaction(this.storeName, "readonly");
            const shopList = transaction.objectStore(this.storeName);
            const request = shopList.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    public async addProduct(product: IProduct): Promise<void> {
        if (!this.db) await this.initDB();

        return new Promise<void>((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, "readwrite");
            const shopList = transaction.objectStore(this.storeName);
            const request = shopList.add(product);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    public async updateProduct(product: IProduct): Promise<void> {
        if (!this.db) await this.initDB();

        return new Promise<void>((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, "readwrite");
            const shopList = transaction.objectStore(this.storeName);
            const request = shopList.put(product);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}


export const dbService = new DBService();