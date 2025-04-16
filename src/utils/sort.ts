export type Product = {
  id: number;
  name: string;
  count: number;
  unit?: { name: string };
  bought?: boolean;
}

export const sortProductStrategies: Record<string, (products: Product[], type: string) => Product[]> = {
  'По умолчанию': (products, _type) => products,
  'По наименованию': (products, type) =>
    [...products].sort((a, b) =>
      type === 'По убыванию' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    ),
  'По количеству': (products, type) =>
    [...products].sort((a, b) =>
      type === 'По убыванию' ? a.count - b.count : b.count - a.count
    ),
  'По дате добавления': (products, type) =>
    [...products].sort((a, b) =>
      type === 'По убыванию' ? a.id - b.id : b.id - a.id
    ),
};

import type {IList} from "@/models/list.model.ts"

export const sortListStrategies: Record<string, (lists: IList[], type: string) => IList[]> = {
  'По умолчанию': (lists, _type) => lists,
  'По наименованию': (lists, type) =>
    [...lists].sort((a, b) =>
      type === 'По убыванию' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    ),
  'По дате создания': (lists, type) =>
    [...lists].sort((a, b) =>
      type === 'По убыванию'
        ? new Date(b.dateCreate).getTime() - new Date(a.dateCreate).getTime()
        : new Date(a.dateCreate).getTime() - new Date(b.dateCreate).getTime()
    ),
};
