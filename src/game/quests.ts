// Quest system - barebones implementation

export const QuestStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type QuestStatus = typeof QuestStatus[keyof typeof QuestStatus];

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  giverId: string; // Character ID who gave the quest
  status: QuestStatus;
  type?: 'main' | 'side'; // Quest type
  objectives: QuestObjective[];
  rewards?: {
    items?: { [itemId: string]: number };
  };
}

// Quest registry
const questRegistry = new Map<string, Quest>();

/**
 * Register a quest
 */
export function registerQuest(quest: Quest): void {
  questRegistry.set(quest.id, quest);
}

/**
 * Get a quest by ID
 */
export function getQuest(questId: string): Quest | undefined {
  return questRegistry.get(questId);
}

/**
 * Get all quests for a character
 */
export function getQuestsForCharacter(characterId: string): Quest[] {
  return Array.from(questRegistry.values()).filter(
    quest => quest.giverId === characterId
  );
}

/**
 * Get active quests (in progress)
 */
export function getActiveQuests(): Quest[] {
  return Array.from(questRegistry.values()).filter(
    quest => quest.status === QuestStatus.IN_PROGRESS
  );
}

/**
 * Start a quest
 */
export function startQuest(questId: string): boolean {
  const quest = getQuest(questId);
  if (!quest || quest.status !== QuestStatus.NOT_STARTED) {
    return false;
  }
  quest.status = QuestStatus.IN_PROGRESS;
  return true;
}

/**
 * Complete a quest objective
 */
export function completeObjective(questId: string, objectiveId: string): boolean {
  const quest = getQuest(questId);
  if (!quest || quest.status !== QuestStatus.IN_PROGRESS) {
    return false;
  }
  const objective = quest.objectives.find(obj => obj.id === objectiveId);
  if (!objective) {
    return false;
  }
  objective.completed = true;
  
  // Check if all objectives are completed
  if (quest.objectives.every(obj => obj.completed)) {
    quest.status = QuestStatus.COMPLETED;
  }
  return true;
}

/**
 * Initialize default quests
 */
export function initializeQuests(): void {
  // Grandma's herb collection quest
  registerQuest({
    id: 'grandma_herb_collection',
    title: 'Collect Three Herbs',
    description: 'Grandma needs three different types of herbs from different biomes for her tea blending.',
    giverId: 'grandma',
    status: QuestStatus.NOT_STARTED,
    type: 'main',
    objectives: [
      {
        id: 'collect_forest_herb',
        description: 'Collect Moonlight Lavender from a forest biome',
        completed: false,
      },
      {
        id: 'collect_plains_herb',
        description: 'Collect Sunset Thyme from a plains biome',
        completed: false,
      },
      {
        id: 'collect_mountain_herb',
        description: 'Collect Peak Rosemary from a mountain biome',
        completed: false,
      },
    ],
    rewards: {
      items: {
        'tea_blend': 1,
      },
    },
  });
}
