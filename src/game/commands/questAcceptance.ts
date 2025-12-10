import type { GameState } from '../gameState';
import { getNearbyPeople } from '../map';
import { getQuest, startQuest, QuestStatus, type Quest } from '../quests';

/**
 * Check if there's a pending quest offer from a nearby character
 */
function findQuestOffer(state: GameState): { characterId: string; quest: Quest } | null {
  if (!state.conversationHistory) {
    return null;
  }

  const nearbyPeople = getNearbyPeople(
    state.currentLocation,
    state.isInside,
    state.companions || [],
    state.playerPosition,
    state.mapSeed
  );
  
  for (const person of nearbyPeople) {
    const personId = person.id.toLowerCase();
    const conversation = state.conversationHistory[personId] || [];
    
    // Check if character has available quests
    const hasAvailableQuests = person.questIds && person.questIds.some(questId => {
      const quest = getQuest(questId);
      return quest && quest.giverId === person.id && quest.status === QuestStatus.NOT_STARTED;
    });
    
    if (hasAvailableQuests) {
      // Find the not-started quest
      const availableQuests = person.questIds || [];
      const quest = availableQuests
        .map(questId => getQuest(questId))
        .filter((q): q is NonNullable<typeof q> => 
          q !== undefined && 
          q.giverId === person.id &&
          q.status === QuestStatus.NOT_STARTED
        )[0];
      
      if (quest) {
        return { characterId: personId, quest };
      }
    }
    
    // Also check conversation history for quest offer text
    if (conversation.length > 0) {
      const lastMessage = conversation[conversation.length - 1];
      if (lastMessage.role === 'npc') {
        const lastMessageLower = lastMessage.content.toLowerCase();
        const hasQuestOffer = lastMessageLower.includes('has offered you the quest') ||
                             lastMessageLower.includes('do you accept');
        
        if (hasQuestOffer && hasAvailableQuests) {
          const availableQuests = person.questIds || [];
          const quest = availableQuests
            .map(questId => getQuest(questId))
            .filter((q): q is NonNullable<typeof q> => 
              q !== undefined && 
              q.giverId === person.id &&
              q.status === QuestStatus.NOT_STARTED
            )[0];
          
          if (quest) {
            return { characterId: personId, quest };
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * Handle quest acceptance/decline for standalone yes/no commands
 * Returns null if no quest offer found or if command should be processed normally
 */
export function handleQuestAcceptance(
  command: string,
  state: GameState
): { success: boolean; message: string; updateState: GameState } | null {
  const lowerCommand = command.toLowerCase();
  const isAcceptanceCommand = lowerCommand === 'yes' || lowerCommand === 'y' || lowerCommand === 'accept' ||
                              lowerCommand === 'no' || lowerCommand === 'n' || lowerCommand === 'decline';
  
  if (!isAcceptanceCommand) {
    return null;
  }
  
  const questOffer = findQuestOffer(state);
  if (!questOffer) {
    return null; // No quest offer, process as normal command
  }
  
  const { quest } = questOffer;
  
  // Handle acceptance
  if (lowerCommand === 'yes' || lowerCommand === 'y' || lowerCommand === 'accept') {
    if (quest.status === QuestStatus.NOT_STARTED) {
      const started = startQuest(quest.id);
      if (started) {
        if (!state.activeQuests) {
          state.activeQuests = {};
        }
        state.activeQuests[quest.id] = quest;
        
        return {
          success: true,
          message: `You have accepted the quest "${quest.title}"!`,
          updateState: state,
        };
      }
    } else {
      return {
        success: true,
        message: `You have already accepted the quest "${quest.title}".`,
        updateState: state,
      };
    }
  }
  
  // Handle decline
  if (lowerCommand === 'no' || lowerCommand === 'n' || lowerCommand === 'decline') {
    return {
      success: true,
      message: `You declined the quest "${quest.title}".`,
      updateState: state,
    };
  }
  
  return null;
}

/**
 * Check if a message should accept a quest (for use in talk handler)
 * Returns the quest if it should be accepted, null otherwise
 */
export function checkQuestAcceptance(
  message: string,
  characterId: string,
  state: GameState
): Quest | null {
  const lowerMessage = message.toLowerCase().trim();
  const messageWords = lowerMessage.split(/\s+/);
  const firstWord = messageWords[0];
  
  const isAccepting = lowerMessage === 'yes' || lowerMessage === 'y' || lowerMessage === 'accept' ||
                     firstWord === 'yes' || firstWord === 'y' || firstWord === 'accept' || 
                     firstWord === 'sure' || firstWord === 'okay' || firstWord === 'ok';
  
  if (!isAccepting) {
    return null;
  }
  
  // Check if this character has available quests
  const nearbyPeople = getNearbyPeople(
    state.currentLocation,
    state.isInside,
    state.companions || [],
    state.playerPosition,
    state.mapSeed
  );
  const person = nearbyPeople.find(p => p.id.toLowerCase() === characterId);
  
  if (!person || !person.questIds) {
    return null;
  }
  
  const availableQuests = person.questIds
    .map(questId => getQuest(questId))
    .filter((q): q is NonNullable<typeof q> => 
      q !== undefined && 
      q.giverId === person.id &&
      q.status === QuestStatus.NOT_STARTED
    );
  
  if (availableQuests.length > 0) {
    return availableQuests[0];
  }
  
  return null;
}

