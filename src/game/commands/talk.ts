import type { CommandHandler } from '../commandHandler';
import { getNearbyPeople } from '../map';
import { getPerson } from '../person';
import { sendChatMessage } from '@/services/chatApi';

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
  const message = args.slice(1).join(' ');

  // Check if person exists
  const person = getPerson(personId);
  if (!person) {
    return {
      success: false,
      message: `I don't know who "${args[0]}" is. Use "people" to see who is nearby.`,
    };
  }

  // Check if person is nearby
  const nearbyPeople = getNearbyPeople(state.currentLocation, state.isInside, state.companions);
  const isNearby = nearbyPeople.some(p => p.id.toLowerCase() === personId);
  
  if (!isNearby) {
    return {
      success: false,
      message: `${person.name} is not nearby. Use "people" to see who is here.`,
    };
  }

  // If no message provided, prompt for one
  if (!message) {
    return {
      success: true,
      message: `What would you like to say to ${person.name}? Use "talk ${personId} [your message]"`,
    };
  }

  // Initialize conversation history if needed
  if (!state.conversationHistory) {
    state.conversationHistory = {};
  }
  if (!state.conversationHistory[personId]) {
    state.conversationHistory[personId] = [];
  }

  try {
    // Get conversation history - keep only recent exchanges
    const fullHistory = state.conversationHistory[personId] || [];
    const recentHistory = fullHistory.slice(-MAX_HISTORY_EXCHANGES * 2); // Keep last N exchanges

    // Build system prompt with core character info
    let systemPrompt = person.buildCorePrompt(state.playerName);
    
    // Add relationship context if there's history
    if (recentHistory.length > 0) {
      const exchangeCount = Math.floor(recentHistory.length / 2);
      if (exchangeCount > 0) {
        systemPrompt += ` You have had ${exchangeCount} previous conversation${exchangeCount > 1 ? 's' : ''} together.`;
      }
    }

    // Build message - include only the most recent exchange for context
    let contextMessage = message;
    if (recentHistory.length >= 2) {
      // Include only the last exchange (2 messages) for immediate context
      const lastExchange = recentHistory.slice(-2);
      const lastUserMsg = lastExchange.find(m => m.role === 'user')?.content || '';
      const lastResponse = lastExchange.find(m => m.role === 'assistant')?.content || '';
      
      if (lastUserMsg && lastResponse) {
        contextMessage = `[Context: Last you said "${lastUserMsg}", ${person.name} replied "${lastResponse}"]\n\nNow you say: ${message}`;
      }
    }

    // Send chat message
    const response = await sendChatMessage(contextMessage, systemPrompt);

    // Update conversation history - maintain limited history
    const updatedHistory = [
      ...recentHistory,
      { role: 'user' as const, content: message },
      { role: 'assistant' as const, content: response },
    ];

    // Trim if too long (keep last MAX_HISTORY_EXCHANGES * 2 messages)
    state.conversationHistory[personId] = updatedHistory.slice(-MAX_HISTORY_EXCHANGES * 2);

    return {
      success: true,
      message: `${person.name}: ${response}`,
      updateState: state,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      return {
        success: false,
        message: `Unable to connect to ${person.name}. The chat service may be unavailable.`,
      };
    }

    return {
      success: false,
      message: `Error talking to ${person.name}: ${errorMessage}`,
    };
  }
};

