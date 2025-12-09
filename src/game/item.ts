// Item system - basic implementation

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'food' | 'herb' | 'tool' | 'misc';
  stackable: boolean;
}

// Item registry
const itemRegistry = new Map<string, Item>();

/**
 * Register an item
 */
export function registerItem(item: Item): void {
  itemRegistry.set(item.id, item);
}

/**
 * Get an item by ID
 */
export function getItem(itemId: string): Item | undefined {
  return itemRegistry.get(itemId);
}

/**
 * Get item name by ID (returns ID if item not found)
 */
export function getItemName(itemId: string): string {
  const item = getItem(itemId);
  return item?.name || itemId;
}

/**
 * Get all items from the registry
 */
export function getAllItems(): Item[] {
  return Array.from(itemRegistry.values());
}

/**
 * Get all herbs from the registry
 */
export function getAllHerbs(): Item[] {
  return getAllItems().filter(item => item.type === 'herb');
}

// Register basic items
registerItem({
  id: 'fresh_apple_pie',
  name: 'Fresh Apple Pie',
  description: 'A warm, freshly baked apple pie with a golden crust.',
  type: 'food',
  stackable: false,
});

// Forest biome herbs
registerItem({
  id: 'forest_herb',
  name: 'Moonlight Lavender',
  description: 'A rare, fragrant lavender that only blooms under the dappled moonlight of deep forests. Grandma needs this for her special tea blend.',
  type: 'herb',
  stackable: true,
});

registerItem({
  id: 'forest_common_1',
  name: 'Shadowleaf Basil',
  description: 'A dark-leaved basil that thrives in the shade of ancient trees.',
  type: 'herb',
  stackable: true,
});

registerItem({
  id: 'forest_common_2',
  name: 'Mossy Oregano',
  description: 'Wild oregano that grows among the moss-covered roots of forest trees.',
  type: 'herb',
  stackable: true,
});

registerItem({
  id: 'forest_common_3',
  name: 'Fernwood Parsley',
  description: 'Curly parsley that grows alongside ferns in the forest undergrowth.',
  type: 'herb',
  stackable: true,
});

// Plains biome herbs
registerItem({
  id: 'plains_herb',
  name: 'Sunset Thyme',
  description: 'A delicate thyme with golden hues that only appears in plains at sunset. Grandma needs this for her special tea blend.',
  type: 'herb',
  stackable: true,
});

registerItem({
  id: 'plains_common_1',
  name: 'Golden Chamomile',
  description: 'Delicate yellow flowers with a soothing, apple-like fragrance that sway in the prairie breeze.',
  type: 'herb',
  stackable: true,
});

registerItem({
  id: 'plains_common_2',
  name: 'Wild Dill',
  description: 'Feathery dill that grows wild among the tall grasses of the plains.',
  type: 'herb',
  stackable: true,
});

registerItem({
  id: 'plains_common_3',
  name: 'Meadow Sage',
  description: 'Soft, velvety sage leaves that carpet the open meadows.',
  type: 'herb',
  stackable: true,
});

// Mountain biome herbs
registerItem({
  id: 'mountain_herb',
  name: 'Peak Rosemary',
  description: 'A rare rosemary that grows only on the highest mountain peaks. Grandma needs this for her special tea blend.',
  type: 'herb',
  stackable: true,
});

registerItem({
  id: 'mountain_common_1',
  name: 'Stonecrop Mint',
  description: 'A hardy mint that grows in rocky crevices, with a sharp, invigorating flavor.',
  type: 'herb',
  stackable: true,
});

registerItem({
  id: 'mountain_common_2',
  name: 'Alpine Thyme',
  description: 'Low-growing thyme that clings to rocky slopes, surviving harsh mountain winds.',
  type: 'herb',
  stackable: true,
});

registerItem({
  id: 'mountain_common_3',
  name: 'Cloudberry Leaf',
  description: 'Aromatic leaves from the cloudberry plant, found only in high-altitude regions.',
  type: 'herb',
  stackable: true,
});

registerItem({
  id: 'tea_blend',
  name: 'Special Tea Blend',
  description: 'A carefully crafted tea blend made by Grandma.',
  type: 'food',
  stackable: false,
});

