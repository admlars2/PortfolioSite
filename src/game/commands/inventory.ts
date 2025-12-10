import type { CommandHandler } from '../commandHandler';
import type { GameState } from '../gameState';

export const handleInventory: CommandHandler = (_args, state: GameState) => {
  const inventory = state.inventory;
  
  let message = `Gold: ${state.gold ?? 0}\n`;
  message += 'Inventory:\n';
  message += '═'.repeat(50) + '\n';
  
  const items = inventory.getAllItems();
  if (items.length === 0) {
    message += '\n  (empty)\n';
  } else {
    message += '\n';
    items.forEach(item => {
      const cappedQuantity = Math.min(item.quantity, 99);
      const quantity = `${cappedQuantity}x `;
      const desc = item.description ? ` - ${item.description}` : '';
      message += `  • ${quantity}${item.name}${desc}\n`;
    });
    message += `\nTotal items: ${inventory.getTotalItems()}\n`;
  }
  
  return {
    success: true,
    message: message.trim(),
  };
};

