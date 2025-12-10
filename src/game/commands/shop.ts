import type { CommandHandler } from '../commandHandler';
import { getNPCsOnTile, getTileAt } from '../map';
import { ensureItemMetadata, findShopItem, removeZeroQuantity, type ShopState } from '../shop';
import type { GameState } from '../gameState';
import { getItem } from '../item';

const MIN_ACCEPT_RATIO = 0.8; // Minimum ratio of base price a shopkeeper will accept

function formatShopList(shop: ShopState, playerGold: number): string {
  if (!shop.items || shop.items.length === 0) {
    return `Shop stock:\n\n  (empty)\n\nYou have ${playerGold} gold.`;
  }

  const lines = shop.items.map(item => {
    const price = `${item.price}g`;
    return `  • ${item.name} (${item.quantity} available) - ${price}${item.description ? ` - ${item.description}` : ''}`;
  });

  return `Shop stock:\n\n${lines.join('\n')}\n\nYou have ${playerGold} gold.`;
}

function pickShopkeeper(
  shopkeepers: { id: string; name: string }[],
  shopState: Record<string, ShopState>,
  nameHint?: string
) {
  if (nameHint) {
    const lower = nameHint.toLowerCase();
    const match = shopkeepers.find(
      s => s.id.toLowerCase() === lower || s.name.toLowerCase().startsWith(lower)
    );
    if (match) {
      return match;
    }
  }
  if (shopkeepers.length === 1) {
    return shopkeepers[0];
  }
  return null;
}

function parseQuantity(value?: string): number | null {
  if (!value) return 1;
  const qty = Number(value);
  if (Number.isNaN(qty) || qty <= 0) return null;
  return Math.min(Math.floor(qty), 99);
}

export const handleShop: CommandHandler = (args, state: GameState) => {
  const { x, y } = state.playerPosition;
  // Ensure NPCs (and shop state) are generated for this tile
  const npcsOnTile = getNPCsOnTile(x, y, state.mapSeed);
  const tile = getTileAt(x, y);
  if (!tile.shopState) {
    tile.shopState = {};
  }

  // Determine which NPCs are shopkeepers (have shopState entry)
  const shopkeepers = npcsOnTile.filter(npc => tile.shopState && tile.shopState[npc.id]);

  if (shopkeepers.length === 0) {
    return {
      success: false,
      message: 'There is no shopkeeper here to trade with.',
    };
  }

  const [first, ...rest] = args;
  const actionHint = first?.toLowerCase();

  const isAction = actionHint === 'buy' || actionHint === 'offer';

  const targetName = isAction ? (shopkeepers.length > 1 ? rest[0] : undefined) : first;
  const remaining = isAction ? (shopkeepers.length > 1 ? rest.slice(1) : rest) : rest;
  const action = isAction ? actionHint : 'list';

  const chosen = pickShopkeeper(
    shopkeepers.map(s => ({ id: s.id, name: s.name })),
    tile.shopState,
    targetName
  );

  if (!chosen) {
    const names = shopkeepers.map(s => s.name).join(', ');
    return {
      success: false,
      message: `Multiple shopkeepers are nearby: ${names}.\nSpecify one like "shop ${shopkeepers[0].name.toLowerCase()}".`,
    };
  }

  const shop = tile.shopState[chosen.id] || { items: [] };

  if (action === 'list') {
    return {
      success: true,
      message: `${chosen.name}'s stall\n\n${formatShopList(shop, state.gold ?? 0)}\n\nUse "shop buy ${chosen.name.toLowerCase()} [item] [qty]" or "shop offer ${chosen.name.toLowerCase()} [item] [qty] [gold]".`,
    };
  }

  // Action: buy or offer
  const [itemQuery, qtyArg, offerArg] = remaining;
  if (!itemQuery) {
    return {
      success: false,
      message: `Specify an item to ${action}. Example: "shop ${action} ${chosen.name.toLowerCase()} meadow sage 1${action === 'offer' ? ' 12' : ''}".`,
    };
  }

  const qty = parseQuantity(qtyArg);
  if (!qty) {
    return {
      success: false,
      message: 'Quantity must be a positive number.',
    };
  }

  const shopItem = findShopItem(shop, itemQuery);
  if (!shopItem) {
    return {
      success: false,
      message: `${chosen.name} doesn't have that item.`,
    };
  }

  if (shopItem.quantity < qty) {
    return {
      success: false,
      message: `${chosen.name} only has ${shopItem.quantity} available.`,
    };
  }

  const baseTotal = shopItem.price * qty;

  if (action === 'buy') {
    if ((state.gold ?? 0) < baseTotal) {
      return {
        success: false,
        message: `You need ${baseTotal} gold but only have ${state.gold ?? 0}.`,
      };
    }

    shopItem.quantity -= qty;
    removeZeroQuantity(shop);

    const meta = ensureItemMetadata(shopItem.itemId);
    state.inventory.addItem(shopItem.itemId, meta.name, qty, meta.description);
    const newGold = (state.gold ?? 0) - baseTotal;

    return {
      success: true,
      message: `You bought ${qty} ${shopItem.name} for ${baseTotal} gold. You now have ${newGold} gold.`,
      stateUpdate: {
        gold: newGold,
      },
    };
  }

  // Action: offer
  const offerTotal = Number(offerArg);
  if (Number.isNaN(offerTotal) || offerTotal <= 0) {
    return {
      success: false,
      message: 'Please specify your gold offer as a number.',
    };
  }

  const minAccept = Math.ceil(baseTotal * MIN_ACCEPT_RATIO);
  if (offerTotal < minAccept) {
    return {
      success: false,
      message: `${chosen.name} shakes their head. They want at least ${minAccept} gold (base price ${baseTotal}).`,
    };
  }

  if ((state.gold ?? 0) < offerTotal) {
    return {
      success: false,
      message: `You offered ${offerTotal} gold but only have ${state.gold ?? 0}.`,
    };
  }

  shopItem.quantity -= qty;
  removeZeroQuantity(shop);

  const meta = ensureItemMetadata(shopItem.itemId);
  state.inventory.addItem(shopItem.itemId, meta.name, qty, meta.description);
  const newGold = (state.gold ?? 0) - offerTotal;

  return {
    success: true,
    message: `${chosen.name} accepts your offer. You bought ${qty} ${shopItem.name} for ${offerTotal} gold (base was ${baseTotal}). You now have ${newGold} gold.`,
    stateUpdate: {
      gold: newGold,
    },
  };
};

