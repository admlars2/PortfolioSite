import type { CommandHandler } from '../commandHandler';
import type { GameState } from '../gameState';
import { getQuest, QuestStatus } from '../quests';
import { getItemName } from '../item';

export const handleQuests: CommandHandler = (_args, state: GameState) => {
  const activeQuests = state.activeQuests || {};
  
  let message = 'Active Quests:\n';
  message += '═'.repeat(50) + '\n';
  
  const questEntries = Object.values(activeQuests);
  
  if (questEntries.length === 0) {
    message += '\n  (no active quests)\n';
    message += '\nUse "talk [person]" to see if anyone has quests for you.\n';
  } else {
    message += '\n';
    questEntries.forEach(quest => {
      // Get the latest quest data from registry to ensure status is current
      const currentQuest = getQuest(quest.id);
      if (!currentQuest) {
        return; // Skip if quest no longer exists
      }
      
      message += `  • ${currentQuest.title}\n`;
      message += `    ${currentQuest.description}\n`;
      
      if (currentQuest.objectives && currentQuest.objectives.length > 0) {
        message += `    Objectives:\n`;
        currentQuest.objectives.forEach(objective => {
          const status = objective.completed ? '✓' : '○';
          message += `      ${status} ${objective.description}\n`;
        });
      }
      
      if (currentQuest.rewards && currentQuest.rewards.items) {
        const itemRewards = Object.entries(currentQuest.rewards.items)
          .map(([itemId, qty]) => `${qty} ${getItemName(itemId)}`)
          .join(', ');
        if (itemRewards) {
          message += `    Rewards: ${itemRewards}\n`;
        }
      }
      
      message += `    Status: ${currentQuest.status === QuestStatus.IN_PROGRESS ? 'In Progress' : currentQuest.status === QuestStatus.COMPLETED ? 'Completed' : 'Not Started'}\n`;
      message += '\n';
    });
  }
  
  return {
    success: true,
    message: message.trim(),
  };
};

