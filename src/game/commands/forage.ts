import type { CommandHandler } from '../commandHandler';
import { getTileAt, type BiomeType } from '../map';
import { getItem } from '../item';
import { completeObjective, getQuest, QuestStatus } from '../quests';

// Herb pools for each biome with probabilities
interface HerbPool {
  herbId: string;
  probability: number; // 0-1, relative weight
}

const HERB_POOLS: Record<BiomeType, HerbPool[]> = {
  forest: [
    { herbId: 'forest_common_1', probability: 0.4 }, // Shadowleaf Basil
    { herbId: 'forest_common_2', probability: 0.3 }, // Mossy Oregano
    { herbId: 'forest_common_3', probability: 0.2 }, // Fernwood Parsley
    { herbId: 'forest_herb', probability: 0.1 }, // Moonlight Lavender - rare, Grandma needs this
  ],
  plains: [
    { herbId: 'plains_common_1', probability: 0.4 }, // Golden Chamomile
    { herbId: 'plains_common_2', probability: 0.3 }, // Wild Dill
    { herbId: 'plains_common_3', probability: 0.2 }, // Meadow Sage
    { herbId: 'plains_herb', probability: 0.1 }, // Sunset Thyme - rare, Grandma needs this
  ],
  mountain: [
    { herbId: 'mountain_common_1', probability: 0.4 }, // Stonecrop Mint
    { herbId: 'mountain_common_2', probability: 0.3 }, // Alpine Thyme
    { herbId: 'mountain_common_3', probability: 0.2 }, // Cloudberry Leaf
    { herbId: 'mountain_herb', probability: 0.1 }, // Peak Rosemary - rare, Grandma needs this
  ],
};

/**
 * Select an herb from the pool based on probabilities
 */
function selectHerbFromPool(pool: HerbPool[]): string {
  // Calculate total weight
  const totalWeight = pool.reduce((sum, herb) => sum + herb.probability, 0);
  
  // Generate random number between 0 and totalWeight
  let random = Math.random() * totalWeight;
  
  // Select herb based on weighted probability
  for (const herb of pool) {
    random -= herb.probability;
    if (random <= 0) {
      return herb.herbId;
    }
  }
  
  // Fallback to first herb (shouldn't happen)
  return pool[0].herbId;
}

export const handleForage: CommandHandler = (args, state) => {
  // Player must be outside to forage
  if (state.isInside) {
    return {
      success: false,
      message: "You can't forage while inside. Go outside first.",
    };
  }

  const tile = getTileAt(state.playerPosition.x, state.playerPosition.y);
  
  // Check if tile has a biome (should always have one, but safety check)
  if (!tile.biome) {
    return {
      success: false,
      message: "You can't forage here. This area doesn't have any herbs.",
    };
  }

  // Check if tile already has an assigned herb
  if (tile.assignedHerb) {
    const herb = getItem(tile.assignedHerb);
    if (!herb) {
      // Herb was removed from registry, clear assignment
      tile.assignedHerb = undefined;
    } else {
      // Add the already-assigned herb to inventory
      state.inventory.addItem(tile.assignedHerb, herb.name, 1, herb.description);
      
      // Check if this herb completes a quest objective (even if already collected from this tile)
      let questUpdateMessage = '';
      if (state.activeQuests) {
        const grandmaQuest = getQuest('grandma_herb_collection');
        if (grandmaQuest && state.activeQuests['grandma_herb_collection']) {
          const herbToObjective: Record<string, string> = {
            'forest_herb': 'collect_forest_herb',
            'plains_herb': 'collect_plains_herb',
            'mountain_herb': 'collect_mountain_herb',
          };
          
          const objectiveId = herbToObjective[tile.assignedHerb];
          if (objectiveId) {
            const objective = grandmaQuest.objectives.find(obj => obj.id === objectiveId);
            if (objective && !objective.completed) {
              const completed = completeObjective('grandma_herb_collection', objectiveId);
              if (completed) {
                state.activeQuests['grandma_herb_collection'] = grandmaQuest;
                
                if (grandmaQuest.status === QuestStatus.COMPLETED) {
                  questUpdateMessage = `\n\nQuest objective completed: ${objective.description}\nQuest completed: ${grandmaQuest.title}!`;
                } else {
                  questUpdateMessage = `\n\nQuest objective completed: ${objective.description}`;
                }
              }
            }
          }
        }
      }
      
      return {
        success: true,
        message: `You found ${herb.name}!${questUpdateMessage}`,
        updateState: state,
      };
    }
  }

  // Select herb from pool based on biome
  const pool = HERB_POOLS[tile.biome];
  const selectedHerbId = selectHerbFromPool(pool);
  const herb = getItem(selectedHerbId);
  
  if (!herb) {
    return {
      success: false,
      message: "You couldn't find any herbs here.",
    };
  }

  // Assign herb to tile
  tile.assignedHerb = selectedHerbId;
  
  // Add herb to inventory
  state.inventory.addItem(selectedHerbId, herb.name, 1, herb.description);

  // Check if this herb completes a quest objective
  let questUpdateMessage = '';
  if (state.activeQuests) {
    // Check grandma's herb collection quest
    const grandmaQuest = getQuest('grandma_herb_collection');
    if (grandmaQuest && state.activeQuests['grandma_herb_collection']) {
      // Map herb IDs to objective IDs
      const herbToObjective: Record<string, string> = {
        'forest_herb': 'collect_forest_herb',
        'plains_herb': 'collect_plains_herb',
        'mountain_herb': 'collect_mountain_herb',
      };
      
      const objectiveId = herbToObjective[selectedHerbId];
      if (objectiveId) {
        const objective = grandmaQuest.objectives.find(obj => obj.id === objectiveId);
        if (objective && !objective.completed) {
          const completed = completeObjective('grandma_herb_collection', objectiveId);
          if (completed) {
            // Update the quest in activeQuests
            state.activeQuests['grandma_herb_collection'] = grandmaQuest;
            
            // Check if quest is now completed
            if (grandmaQuest.status === QuestStatus.COMPLETED) {
              questUpdateMessage = `\n\nQuest objective completed: ${objective.description}\nQuest completed: ${grandmaQuest.title}!`;
            } else {
              questUpdateMessage = `\n\nQuest objective completed: ${objective.description}`;
            }
          }
        }
      }
    }
  }

  return {
    success: true,
    message: `You found ${herb.name}!${questUpdateMessage}`,
    updateState: state,
  };
};

