import type { CommandHandler } from '../commandHandler';
import { getNearbyPeople } from '../map';
import { getCharacter, type ToolContext } from '../person';
import { startQuest, QuestStatus, type Quest } from '../quests';
import { checkQuestAcceptance } from './questAcceptance';

// Limit conversation history to recent exchanges (optimized for context window)
const MAX_HISTORY_EXCHANGES = 6; // Keep last 6 exchanges (12 messages total)

export const handleTalk: CommandHandler = async (args, state) => {
  if (args.length === 0) {
    return {
      success: false,
      message: 'Talk to whom? Use "talk [person] [message]" or "talk [person]".\nUse "people" to see who is nearby.',
    };
  }

  const personId = args[0].toLowerCase();
  const message = args.slice(1).join(' ').trim();

  // Check if character exists
  const character = getCharacter(personId);
  if (!character) {
    return {
      success: false,
      message: `I don't know who "${args[0]}" is. Use "people" to see who is nearby.`,
    };
  }

  // Check if character is nearby
  const nearbyPeople = getNearbyPeople(state.currentLocation, state.isInside, state.companions);
  const isNearby = nearbyPeople.some(p => p.id.toLowerCase() === personId);
  
  if (!isNearby) {
    return {
      success: false,
      message: `${character.name} is not nearby. Use "people" to see who is here.`,
    };
  }

  // If no message provided, character starts the conversation
  if (!message) {
    // Initialize conversation history if needed
    if (!state.conversationHistory) {
      state.conversationHistory = {};
    }
    if (!state.conversationHistory[personId]) {
      state.conversationHistory[personId] = [];
    }

    // Check if this is first conversation
    const history = state.conversationHistory[personId] || [];
    const isFirstConversation = history.length === 0;

    // Get nearby character IDs for context (reuse nearbyPeople from above)
    const nearbyCharacterIds = nearbyPeople.map(p => p.id);

    // Build tool context
    const toolContext: ToolContext = {
      playerName: state.playerName,
      playerInventory: state.inventory,
      companions: state.companions,
      isPlayerNearby: true,
      activeQuests: state.activeQuests || {},
      nearbyCharacters: nearbyCharacterIds,
      conversationHistory: state.conversationHistory[personId] || [],
    };

    // Create a greeting message for the character to respond to
    const greetingMessage = isFirstConversation 
      ? `You walk downstairs after being called by ${character.name} and approach her.`
      : Math.random() > 0.5 
        ? `You have just entered the building and ${character.name} notices you.`
        : `You stare blankly at ${character.name}, waiting for them to speak.`;

    try {
      // Use decideAction to handle tool calls
      const result = await character.decideAction(greetingMessage, toolContext);
      
      // Update conversation history
      const responseText = result.toolResult?.data && typeof result.toolResult.data === 'object' && 'message' in result.toolResult.data
        ? (result.toolResult.data as { message: string }).message
        : result.message.replace(`${character.name}: `, '');
      
      state.conversationHistory[personId] = [
        { role: 'user' as const, content: greetingMessage },
        { role: 'npc' as const, content: responseText },
      ];

      // Handle multiple tool results
      if (result.allToolResults) {
        for (const { tool, result: toolResult } of result.allToolResults) {
          // Note: assign_quest doesn't automatically add to activeQuests - player must accept during conversation
          // Quest is only added when player accepts (yes/no handling)
          if (tool === 'become_companion' && toolResult.success && toolResult.data) {
            const toolData = toolResult.data as { companionId: string };
            if (toolData.companionId && state.companions && !state.companions.includes(toolData.companionId)) {
              state.companions.push(toolData.companionId);
            }
          }
          // give_player_item updates are handled by the tool itself (modifies playerInventory directly)
        }
      } else {
        // Fallback: check single tool result
        // Note: assign_quest doesn't automatically add to activeQuests - player must accept during conversation
        if (result.toolUsed === 'become_companion' && result.toolResult?.data) {
          const toolData = result.toolResult.data as { companionId: string };
          if (toolData.companionId && state.companions && !state.companions.includes(toolData.companionId)) {
            state.companions.push(toolData.companionId);
          }
        }
      }

      // Update inventory if item was given (handled by the tool itself, but ensure state is updated)
      if (result.message.includes('gave you')) {
        // Inventory update is handled by the tool execution
      }

      // Build final message - show quest/item details separately if assigned
      let finalMessage = result.message;
      const toolNotifications: string[] = [];
      let questDetails = '';
      
      // Collect tool call notifications and quest details
      if (result.allToolResults) {
        for (const { tool, result: toolResult } of result.allToolResults) {
          if (tool === 'give_player_item' && toolResult.success && toolResult.data) {
            const toolData = toolResult.data as { itemName?: string; quantity?: number };
            const itemName = toolData.itemName || 'an item';
            const quantity = toolData.quantity && toolData.quantity > 1 ? ` (${toolData.quantity})` : '';
            toolNotifications.push(`${character.name} gave you ${itemName}${quantity}`);
          } else if (tool === 'become_companion' && toolResult.success) {
            toolNotifications.push(`${character.name} has joined your party`);
          } else if (tool === 'assign_quest' && toolResult.success && toolResult.data) {
            const questData = toolResult.data as { questTitle?: string; questDescription?: string; objectives?: string; rewards?: string; questId?: string };
            if (questData.questTitle) {
              questDetails = `\n\n${character.name} has offered you the quest "${questData.questTitle}"`;
              if (questData.questDescription) {
                questDetails += `\n\n${questData.questDescription}`;
              }
              if (questData.objectives) {
                questDetails += `\n\nObjectives:\n${questData.objectives}`;
              }
              if (questData.rewards) {
                questDetails += questData.rewards;
              }
              questDetails += `\n\nDo you accept? (yes/no)`;
            }
          }
        }
      } else {
        // Fallback for single tool results
        if (result.toolUsed === 'give_player_item' && result.toolResult?.success && result.toolResult.data) {
          const toolData = result.toolResult.data as { itemName?: string; quantity?: number };
          const itemName = toolData.itemName || 'an item';
          const quantity = toolData.quantity && toolData.quantity > 1 ? ` (${toolData.quantity})` : '';
          toolNotifications.push(`${character.name} gave you ${itemName}${quantity}`);
        } else if (result.toolUsed === 'become_companion' && result.toolResult?.success) {
          toolNotifications.push(`${character.name} has joined your party`);
        }
      }
      
      // Add tool notifications after the message
      if (toolNotifications.length > 0) {
        finalMessage += '\n\n' + toolNotifications.join('\n');
      }
      
      // Add quest details after tool notifications
      if (questDetails) {
        finalMessage += questDetails;
      }
      
      // On first conversation, add instruction for player
      if (isFirstConversation) {
        finalMessage += `\n\n[Tip: Respond using "talk ${personId} [your message]"]`;
      }

      return {
        success: result.success,
        message: finalMessage,
        updateState: state,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        return {
          success: false,
          message: `Unable to connect to ${character.name}. The chat service may be unavailable.`,
        };
      }

      return {
        success: false,
        message: `Error talking to ${character.name}: ${errorMessage}`,
      };
    }
  }

  // Initialize conversation history if needed
  if (!state.conversationHistory) {
    state.conversationHistory = {};
  }
  if (!state.conversationHistory[personId]) {
    state.conversationHistory[personId] = [];
  }

  // Get nearby character IDs for context (reuse nearbyPeople from above)
  const nearbyCharacterIds = nearbyPeople.map(p => p.id);

  // Build tool context
  const toolContext: ToolContext = {
    playerName: state.playerName,
    playerInventory: state.inventory,
    companions: state.companions,
    isPlayerNearby: true,
    activeQuests: state.activeQuests || {},
    nearbyCharacters: nearbyCharacterIds,
    conversationHistory: state.conversationHistory[personId] || [],
  };

  try {
    // Check if message should accept a quest (for "talk [npc] yes" case)
    // This accepts the quest AND sends the message to NPC for response
    let acceptedQuest: Quest | null = null;
    const questToAccept = checkQuestAcceptance(message, personId, state);
    if (questToAccept && questToAccept.status === QuestStatus.NOT_STARTED) {
      const started = startQuest(questToAccept.id);
      if (started) {
        if (!state.activeQuests) {
          state.activeQuests = {};
        }
        state.activeQuests[questToAccept.id] = questToAccept;
        acceptedQuest = questToAccept;
      }
    }
    
    // Use decideAction to handle tool calls
    const result = await character.decideAction(message, toolContext);
    
    // Get conversation history - keep only recent exchanges
    const fullHistory = state.conversationHistory[personId] || [];
    const recentHistory = fullHistory.slice(-MAX_HISTORY_EXCHANGES * 2);

    // Build final message first to capture quest details
    let finalMessage = result.message;
    const toolNotifications: string[] = [];
    let questDetails = '';
    
    // Add quest acceptance notification if quest was just accepted
    if (acceptedQuest) {
      toolNotifications.push(`Quest accepted: "${acceptedQuest.title}"`);
    }
    
    // Collect tool call notifications and quest details
    if (result.allToolResults) {
      for (const { tool, result: toolResult } of result.allToolResults) {
        if (tool === 'give_player_item' && toolResult.success && toolResult.data) {
          const toolData = toolResult.data as { itemName?: string; quantity?: number };
          const itemName = toolData.itemName || 'an item';
          const quantity = toolData.quantity && toolData.quantity > 1 ? ` (${toolData.quantity})` : '';
          toolNotifications.push(`${character.name} gave you ${itemName}${quantity}`);
        } else if (tool === 'become_companion' && toolResult.success) {
          toolNotifications.push(`${character.name} has joined your party`);
        } else if (tool === 'assign_quest' && toolResult.success && toolResult.data) {
          const questData = toolResult.data as { questTitle?: string; questDescription?: string; objectives?: string; rewards?: string; questId?: string };
          if (questData.questTitle) {
            questDetails = `\n\n${character.name} has offered you the quest "${questData.questTitle}"`;
            if (questData.questDescription) {
              questDetails += `\n\n${questData.questDescription}`;
            }
            if (questData.objectives) {
              questDetails += `\n\nObjectives:\n${questData.objectives}`;
            }
            if (questData.rewards) {
              questDetails += questData.rewards;
            }
            questDetails += `\n\nDo you accept? (yes/no)`;
          }
        }
      }
    } else {
      // Fallback for single tool results
      if (result.toolUsed === 'give_player_item' && result.toolResult?.success && result.toolResult.data) {
        const toolData = result.toolResult.data as { itemName?: string; quantity?: number };
        const itemName = toolData.itemName || 'an item';
        const quantity = toolData.quantity && toolData.quantity > 1 ? ` (${toolData.quantity})` : '';
        toolNotifications.push(`${character.name} gave you ${itemName}${quantity}`);
      } else if (result.toolUsed === 'become_companion' && result.toolResult?.success) {
        toolNotifications.push(`${character.name} has joined your party`);
      }
    }
    
    // Add tool notifications after the message
    if (toolNotifications.length > 0) {
      finalMessage += '\n\n' + toolNotifications.join('\n');
    }
    
    // Add quest details after tool notifications
    if (questDetails) {
      finalMessage += questDetails;
    }

    // Update conversation history with the full final message (including quest details)
    // This ensures quest offers are detectable in conversation history
    const fullNpcResponse = finalMessage.replace(`${character.name}: `, '');
    const updatedHistory = [
      ...recentHistory,
      { role: 'user' as const, content: message },
      { role: 'npc' as const, content: fullNpcResponse },
    ];

    // Trim if too long (keep last MAX_HISTORY_EXCHANGES * 2 messages)
    state.conversationHistory[personId] = updatedHistory.slice(-MAX_HISTORY_EXCHANGES * 2);

    // Handle multiple tool results
    if (result.allToolResults) {
      for (const { tool, result: toolResult } of result.allToolResults) {
        // Note: assign_quest doesn't automatically add to activeQuests - player must accept during conversation
        // Quest is only added when player accepts (yes/no handling above)
        if (tool === 'become_companion' && toolResult.success && toolResult.data) {
          const toolData = toolResult.data as { companionId: string };
          if (toolData.companionId && state.companions && !state.companions.includes(toolData.companionId)) {
            state.companions.push(toolData.companionId);
          }
        }
        // give_player_item updates are handled by the tool itself (modifies playerInventory directly)
      }
    } else {
      // Fallback: check single tool result
      // Note: assign_quest doesn't automatically add to activeQuests - player must accept during conversation
      if (result.toolUsed === 'become_companion' && result.toolResult?.data) {
        const toolData = result.toolResult.data as { companionId: string };
        if (toolData.companionId && state.companions && !state.companions.includes(toolData.companionId)) {
          state.companions.push(toolData.companionId);
        }
      }
    }

    // finalMessage was already built above and saved to conversation history
    // Return it here
    return {
      success: result.success,
      message: finalMessage,
      updateState: state,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      return {
        success: false,
        message: `Unable to connect to ${character.name}. The chat service may be unavailable.`,
      };
    }

    return {
      success: false,
      message: `Error talking to ${character.name}: ${errorMessage}`,
    };
  }
};


