import type {IProduct} from "@/models/product.model.ts";

export interface IList {
  id: number;
  name: string;
  dateCreate: string;
  products: IProduct[];
}