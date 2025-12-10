import { getItem } from './item';

export interface ShopStockItem {
  itemId: string;
  name: string;
  price: number; // price per unit
  quantity: number;
  description?: string;
}

export interface ShopState {
  items: ShopStockItem[];
}

export function findShopItem(shop: ShopState, query: string): ShopStockItem | undefined {
  const lower = query.toLowerCase();
  return shop.items.find(
    item =>
      item.itemId.toLowerCase() === lower ||
      item.name.toLowerCase() === lower ||
      item.name.toLowerCase().startsWith(lower)
  );
}

export function removeZeroQuantity(shop: ShopState): void {
  shop.items = shop.items.filter(item => item.quantity > 0);
}

export function ensureItemMetadata(itemId: string): { name: string; description?: string } {
  const item = getItem(itemId);
  return {
    name: item?.name || itemId,
    description: item?.description,
  };
}

