import type {IUnit} from "@/models/unit.model.ts";


export interface IProduct {
  id: number;
  name: string;
  count?: number;
  bought?: boolean;
  unit?: IUnit;
  categoryId: number;
}