// Player stats and inventory system

export interface PlayerStats {
  health: number;
  maxHealth: number;
  exhaustion: number;
  maxExhaustion: number;
  hunger: number;
  maxHunger: number;
  saturation: number;
  maxSaturation: number;
}

export const defaultPlayerStats: PlayerStats = {
  health: 100,
  maxHealth: 100,
  exhaustion: 0,
  maxExhaustion: 100,
  hunger: 100,
  maxHunger: 100,
  saturation: 100,
  maxSaturation: 100,
};

// Inventory item interface
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  description?: string;
}

// Inventory class
export class Inventory {
  items: Map<string, InventoryItem>;

  constructor() {
    this.items = new Map();
  }

  // Add item to inventory
  addItem(id: string, name: string, quantity: number = 1, description?: string): void {
    const existing = this.items.get(id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.set(id, { id, name, quantity, description });
    }
  }

  // Remove item from inventory
  removeItem(id: string, quantity: number = 1): boolean {
    const item = this.items.get(id);
    if (!item) {
      return false;
    }

    if (item.quantity <= quantity) {
      this.items.delete(id);
    } else {
      item.quantity -= quantity;
    }
    return true;
  }

  // Check if item exists in inventory
  hasItem(id: string, quantity: number = 1): boolean {
    const item = this.items.get(id);
    return item ? item.quantity >= quantity : false;
  }

  // Get item from inventory
  getItem(id: string): InventoryItem | undefined {
    return this.items.get(id);
  }

  // Get all items
  getAllItems(): InventoryItem[] {
    return Array.from(this.items.values());
  }

  // Get total number of items
  getTotalItems(): number {
    return Array.from(this.items.values()).reduce((sum, item) => sum + item.quantity, 0);
  }

  // Serialize for storage
  toJSON(): Record<string, InventoryItem> {
    return Object.fromEntries(this.items);
  }

  // Deserialize from storage
  static fromJSON(data: Record<string, InventoryItem>): Inventory {
    const inventory = new Inventory();
    Object.values(data).forEach(item => {
      inventory.items.set(item.id, item);
    });
    return inventory;
  }
}

// Helper functions for player stats
export function clampStat(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function updateHealth(stats: PlayerStats, amount: number): PlayerStats {
  return {
    ...stats,
    health: clampStat(stats.health + amount, 0, stats.maxHealth),
  };
}

export function updateExhaustion(stats: PlayerStats, amount: number): PlayerStats {
  return {
    ...stats,
    exhaustion: clampStat(stats.exhaustion + amount, 0, stats.maxExhaustion),
  };
}

export function updateHunger(stats: PlayerStats, amount: number): PlayerStats {
  return {
    ...stats,
    hunger: clampStat(stats.hunger + amount, 0, stats.maxHunger),
  };
}

export function updateSaturation(stats: PlayerStats, amount: number): PlayerStats {
  return {
    ...stats,
    saturation: clampStat(stats.saturation + amount, 0, stats.maxSaturation),
  };
}