import type { CommandHandler } from '../commandHandler';
import type { GameState } from '../gameState';

export const handleInventory: CommandHandler = (_args, state: GameState) => {
  const inventory = state.inventory;
  
  let message = 'Inventory:\n';
  message += '═'.repeat(50) + '\n';
  
  const items = inventory.getAllItems();
  if (items.length === 0) {
    message += '\n  (empty)\n';
  } else {
    message += '\n';
    items.forEach(item => {
      const quantity = item.quantity > 1 ? ` x${item.quantity}` : '';
      const desc = item.description ? ` - ${item.description}` : '';
      message += `  • ${item.name}${quantity}${desc}\n`;
    });
    message += `\nTotal items: ${inventory.getTotalItems()}\n`;
  }
  
  return {
    success: true,
    message: message.trim(),
  };
};

