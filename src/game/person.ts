import { getItemName, getItem, getAllHerbs, getAllItems } from './item';
import type { Inventory } from './player';
import { sendChatMessage } from '@/services/chatApi';
import { getQuest, QuestStatus, type Quest } from './quests';

export interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

// Tool system types
export type ToolName = 'become_companion' | 'respond_to_player' | 'give_player_item' | 'assign_quest' | 'update_biography' | 'research_world';

export interface ToolCall {
  tool: ToolName;
  args: Record<string, unknown>;
}

export type ToolCalls = ToolCall | ToolCall[]; // Support single or multiple tool calls

export interface ToolResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface ToolDefinition {
  name: ToolName;
  description: string;
  args: {
    [key: string]: {
      type: string;
      description: string;
      required?: boolean;
    };
  };
  available: (character: Character, context?: ToolContext) => boolean;
  execute: (character: Character, args: Record<string, unknown>, context: ToolContext) => ToolResult;
}

export interface ToolContext {
  playerName?: string;
  playerInventory?: Inventory;
  companions?: string[];
  isPlayerNearby?: boolean;
  activeQuests?: { [questId: string]: Quest };
  nearbyCharacters?: string[]; // List of character IDs nearby
  conversationHistory?: Array<{ role: 'user' | 'npc'; content: string }>; // Recent conversation history
}

// Character class and registry
export class Character {
  contextWindow: number = 128000; // 128k tokens
  id: string;
  name: string;
  description: string;
  canBeCompanion: boolean;
  biography: string; // Background story of the character
  personality: PersonalityTraits; // Core personality traits
  job: string;
  skills: { [key: string]: number }; // Skills (e.g., "crafting", "fishing", "mining")
  relationshipContext: { [key: string]: string }; // Relationship context with other characters
  questIds: string[]; // Quest IDs this character can give
  chatHistory: string[];
  inventory: { [key: string]: number };
  usedTokens: number = 0; // Track token usage for context window management
  
  constructor(
    id: string,
    name: string,
    description: string,
    personality: PersonalityTraits,
    options: {
      canBeCompanion?: boolean;
      biography?: string;
      job?: string;
      skills?: { [key: string]: number };
      relationshipContext?: { [key: string]: string };
      questIds?: string[];
      inventory?: { [key: string]: number };
    } = {}
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.personality = personality;
    this.canBeCompanion = options.canBeCompanion ?? false;
    this.biography = options.biography ?? '';
    this.job = options.job ?? '';
    this.skills = options.skills ?? {};
    this.relationshipContext = options.relationshipContext ?? {};
    this.questIds = options.questIds ?? [];
    this.chatHistory = [];
    this.inventory = options.inventory ?? {};
  }

  /**
   * Build core system prompt for this character
   * Optimized for limited context windows
   * @param playerName Optional player name
   * @param context Optional tool context for determining available tools
   * @param includeTools Whether to include tool specifications (default: true)
   */
  buildCorePrompt(playerName?: string, context: ToolContext = {}, includeTools: boolean = true): string {
    let prompt = `You are ${this.name}`;
    
    if (this.biography) {
      prompt += `. ${this.biography}`;
    }
    
    if (this.job) {
      prompt += ` You ${this.job.includes('owned') || this.job.includes('was') ? '' : 'work as '}${this.job}.`;
    }
    
    // Add player relationship (if playerName is provided, use it; otherwise use generic "grandchild")
    if (playerName) {
      const playerRelationship = this.relationshipContext[playerName.toLowerCase()] || 
                                 (this.id === 'grandma' || this.id === 'grandpa' ? 'grandchild' : 'friend');
      prompt += ` You know ${playerName} as your ${playerRelationship}.`;
    } else if (this.id === 'grandma' || this.id === 'grandpa') {
      prompt += ` You have a grandchild who lives with you.`;
    }
    
    // Add relationships to other characters
    const otherRelationships = Object.entries(this.relationshipContext)
      .filter(([key]) => key.toLowerCase() !== playerName?.toLowerCase())
      .map(([charId, relationship]) => {
        const char = characterRegistry[charId];
        return char ? `${char.name} (your ${relationship})` : null;
      })
      .filter((r): r is string => r !== null);
    
    if (otherRelationships.length > 0) {
      prompt += ` You have relationships with: ${otherRelationships.join(', ')}.`;
    }
    
    prompt += ` ${this.description}`;
    
    // Add personality traits summary with full range including negative traits
    const traits = this.personality;
    const traitDescriptions: string[] = [];
    
    // Openness (curiosity, creativity, openness to experience)
    if (traits.openness > 0.75) {
      traitDescriptions.push('highly curious, creative, and open to new experiences');
    } else if (traits.openness > 0.5) {
      traitDescriptions.push('moderately open-minded and curious');
    } else if (traits.openness > 0.25) {
      traitDescriptions.push('somewhat traditional and prefer familiar routines');
    } else {
      traitDescriptions.push('very traditional, closed-minded, and resistant to change');
    }
    
    // Conscientiousness (organization, reliability, self-discipline)
    if (traits.conscientiousness > 0.75) {
      traitDescriptions.push('highly organized, reliable, and disciplined');
    } else if (traits.conscientiousness > 0.5) {
      traitDescriptions.push('moderately organized and dependable');
    } else if (traits.conscientiousness > 0.25) {
      traitDescriptions.push('somewhat disorganized and spontaneous');
    } else {
      traitDescriptions.push('very disorganized, unreliable, and careless');
    }
    
    // Extraversion (sociability, assertiveness, energy)
    if (traits.extraversion > 0.75) {
      traitDescriptions.push('highly outgoing, energetic, and sociable');
    } else if (traits.extraversion > 0.5) {
      traitDescriptions.push('moderately social and expressive');
    } else if (traits.extraversion > 0.25) {
      traitDescriptions.push('somewhat reserved and prefer solitude');
    } else {
      traitDescriptions.push('very introverted, quiet, and withdrawn');
    }
    
    // Agreeableness (trust, altruism, kindness, cooperation)
    if (traits.agreeableness > 0.75) {
      traitDescriptions.push('very kind, trusting, and cooperative');
    } else if (traits.agreeableness > 0.5) {
      traitDescriptions.push('moderately friendly and agreeable');
    } else if (traits.agreeableness > 0.25) {
      traitDescriptions.push('somewhat skeptical and competitive');
    } else {
      traitDescriptions.push('very suspicious, manipulative, and uncooperative');
    }
    
    // Neuroticism (emotional stability, anxiety, moodiness)
    if (traits.neuroticism > 0.75) {
      traitDescriptions.push('highly anxious, moody, and emotionally unstable');
    } else if (traits.neuroticism > 0.5) {
      traitDescriptions.push('somewhat anxious and sensitive to stress');
    } else if (traits.neuroticism > 0.25) {
      traitDescriptions.push('moderately calm and emotionally stable');
    } else {
      traitDescriptions.push('very calm, resilient, and emotionally stable');
    }
    
    if (traitDescriptions.length > 0) {
      prompt += ` You are ${traitDescriptions.join(', ')}.`;
    }
    
    // Add inventory information - make it clear this is ALL they have
    const inventoryItems = Object.entries(this.inventory)
      .filter(([_, count]) => count > 0)
      .map(([itemId, count]) => {
        const itemName = getItemName(itemId);
        const cappedQuantity = Math.min(count, 99);
        return `${cappedQuantity}x ${itemName}`;
      });
    
    if (inventoryItems.length > 0) {
      prompt += ` Your complete inventory consists of only these items: ${inventoryItems.join(', ')}. This is everything can give away.`;
    } else {
      prompt += ` You currently have no items in your inventory.`;
    }
    
    // Add companion availability information
    if (this.canBeCompanion) {
      prompt += ` You are available to become a companion and join the player on their journey if they ask.`;
    } else {
      prompt += ` You are NOT available to become a companion - you have other responsibilities and cannot leave to travel with the player.`;
    }
    
    // Add available quests information
    if (this.questIds && this.questIds.length > 0) {
      const availableQuests = this.questIds
        .map(questId => getQuest(questId))
        .filter((quest): quest is NonNullable<typeof quest> => 
          quest !== undefined && 
          quest.giverId === this.id &&
          quest.status === QuestStatus.NOT_STARTED
        );
      
      if (availableQuests.length > 0) {
        const questList = availableQuests.map(q => `"${q.title}" (quest_id: ${q.id})`).join(', ');
        prompt += ` You have ${availableQuests.length} available quest${availableQuests.length > 1 ? 's' : ''} to offer: ${questList}.`;
      }
    }
    
    // Add tool specifications if requested
    if (includeTools) {
      const toolSpec = this.buildToolSpecifications(context);
      if (toolSpec) {
        prompt += toolSpec;
      } else {
        // If no tools available, still tell them to respond normally
        prompt += '\n\nRespond naturally and in character. Keep responses concise.';
      }
    } else {
    prompt += ' Keep responses concise and in character.';
    }
    
    // Track tokens used in prompt
    this.trackTokens(prompt);
    
    return prompt;
  }
  
  /**
   * Give an item from this character's inventory to a player
   * @param itemId The ID of the item to give
   * @param quantity The quantity to give (default: 1)
   * @param playerInventory The player's inventory to add the item to
   * @returns Object with success status and message
   */
  giveItemToPlayer(itemId: string, quantity: number = 1, playerInventory: Inventory): {
    success: boolean;
    message: string;
    data?: { itemName: string; quantity: number };
  } {
    // Check if character has the item
    const currentQuantity = this.inventory[itemId] || 0;
    if (currentQuantity < quantity) {
      return {
        success: false,
        message: `${this.name} doesn't have enough ${getItemName(itemId)} to give you.`,
      };
    }

    // Check if item exists in registry
    const item = getItem(itemId);
    if (!item) {
      return {
        success: false,
        message: `Unknown item: ${itemId}`,
      };
    }

    // Remove from character's inventory
    this.inventory[itemId] = currentQuantity - quantity;
    if (this.inventory[itemId] <= 0) {
      delete this.inventory[itemId];
    }

    // Add to player's inventory
    playerInventory.addItem(itemId, item.name, quantity, item.description);

    return {
      success: true,
      message: '', // Silent - notification will be shown separately
      data: { itemName: item.name, quantity },
    };
  }

  /**
   * Generate a response to a message based on the character's personality and context
   * This can be used for characters to respond to player messages or initiate conversations
   * @param message The message to respond to
   * @param playerName Optional player name for personalization
   * @returns A response string (this would typically call the chat API, but returns a placeholder here)
   */
  respondToMessage(_message: string, _playerName?: string): string {
    // This method provides a way for characters to respond to messages
    // In a full implementation, this would call sendChatMessage with the character's prompt
    // For now, it returns a placeholder that indicates the character is processing
    return `[${this.name} is thinking about how to respond...]`;
  }

  /**
   * Get available tools for this character based on context
   */
  getAvailableTools(context: ToolContext = {}): ToolDefinition[] {
    return TOOL_REGISTRY.filter(tool => tool.available(this, context));
  }

  /**
   * Build tool specifications string for system prompt
   */
  buildToolSpecifications(context: ToolContext = {}): string {
    const availableTools = this.getAvailableTools(context);
    
    if (availableTools.length === 0) {
      return '';
    }

    let spec = '\n\nYou have access to the following tools. You MUST respond ONLY with a JSON object or array in this exact format:\n';
    spec += 'Single tool:\n';
    spec += '{\n';
    spec += '  "tool": "tool_name",\n';
    spec += '  "args": { ... }\n';
    spec += '}\n\n';
    spec += 'Multiple tools (use when you want to do multiple things at once):\n';
    spec += '[\n';
    spec += '  { "tool": "tool_name", "args": { ... } },\n';
    spec += '  { "tool": "tool_name", "args": { ... } }\n';
    spec += ']\n\n';
    spec += 'Available tools:\n\n';

    availableTools.forEach((tool, index) => {
      spec += `${index + 1}. ${tool.name}\n`;
      spec += `   Description: ${tool.description}\n`;
      spec += `   Arguments:\n`;
      
      Object.entries(tool.args).forEach(([argName, argSpec]) => {
        const required = argSpec.required !== false ? ' (required)' : ' (optional)';
        spec += `     - ${argName} (${argSpec.type})${required}: ${argSpec.description}\n`;
      });
      spec += '\n';
    });

    spec += 'Examples:\n';
    spec += 'Single tool example:\n';
    spec += '{\n';
    spec += '  "tool": "give_player_item",\n';
    spec += '  "args": { "item_id": "fresh_apple_pie", "quantity": 1 }\n';
    spec += '}\n\n';
    
    spec += 'Multiple tools example:\n';
    spec += '[\n';
    spec += '  { "tool": "give_player_item", "args": { "item_id": "fresh_apple_pie", "quantity": 1 } },\n';
    spec += '  { "tool": "assign_quest", "args": { "quest_id": "grandma_herb_collection" } },\n';
    spec += '  { "tool": "respond_to_player", "args": { "message": "Here is a pie and a quest for you!" } }\n';
    spec += ']\n\n';

    spec += 'IMPORTANT: When using tools, keep your natural language responses conversational and avoid mentioning technical details like quest IDs, item IDs, or tool names. Just speak naturally as your character would.\n\n';
    spec += 'CRITICAL: You MUST respond with ONLY valid JSON. No additional text, no markdown code blocks (no ```json or ```), no explanations. Just the raw JSON object or array.';

    return spec;
  }

  /**
   * Parse JSON tool call(s) from AI response
   * Supports both single tool call and array of tool calls
   */
  parseToolCall(response: string): ToolCall[] | null {
    try {
      // Try to extract JSON from response (handle cases where AI wraps it in markdown)
      let jsonStr = response.trim();
      
      // Remove markdown code blocks if present (more aggressive removal)
      // Handle various markdown formats: ```json, ```, and any leading/trailing whitespace
      jsonStr = jsonStr
        .replace(/^```json\s*/gim, '')
        .replace(/^```\s*/gim, '')
        .replace(/```\s*$/gim, '')
        .trim();
      
      // Find the JSON content by locating the first [ or { and matching to the last ] or }
      const firstBracket = jsonStr.indexOf('[');
      const firstBrace = jsonStr.indexOf('{');
      let startIdx = -1;
      if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
        startIdx = firstBracket;
      } else if (firstBrace !== -1) {
        startIdx = firstBrace;
      }
      
      if (startIdx !== -1) {
        // Find matching closing bracket/brace by tracking depth
        let depth = 0;
        let inString = false;
        let escapeNext = false;
        let endIdx = jsonStr.length;
        
        for (let i = startIdx; i < jsonStr.length; i++) {
          const char = jsonStr[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            continue;
          }
          
          if (inString) continue;
          
          if (char === '[' || char === '{') {
            depth++;
          } else if (char === ']' || char === '}') {
            depth--;
            if (depth === 0) {
              endIdx = i + 1;
              break;
            }
          }
        }
        
        jsonStr = jsonStr.substring(startIdx, endIdx);
      }

      // Normalize quotes - replace curly quotes with straight quotes
      // Also handle other problematic characters
      jsonStr = jsonStr
        .replace(/['']/g, "'")      // Replace curly single quotes
        .replace(/[""]/g, '"')     // Replace curly double quotes
        .replace(/['']/g, "'")      // Replace other curly single quotes
        .replace(/[""]/g, '"')      // Replace other curly double quotes
        .replace(/[\u201C\u201D]/g, '"') // Replace left/right double quotation marks
        .replace(/[\u2018\u2019]/g, "'"); // Replace left/right single quotation marks

      const parsed = JSON.parse(jsonStr);
      
      // Handle array of tool calls
      if (Array.isArray(parsed)) {
        const toolCalls: ToolCall[] = [];
        for (const item of parsed) {
          if (item && typeof item === 'object' && 'tool' in item && 'args' in item) {
            if (['become_companion', 'respond_to_player', 'give_player_item', 'assign_quest', 'update_biography', 'research_world'].includes(item.tool)) {
              toolCalls.push(item as ToolCall);
            }
          }
        }
        return toolCalls.length > 0 ? toolCalls : null;
      }
      
      // Handle single tool call
      if (parsed && typeof parsed === 'object' && 'tool' in parsed && 'args' in parsed) {
        // Validate tool name
        if (!['become_companion', 'respond_to_player', 'give_player_item', 'assign_quest', 'update_biography', 'research_world'].includes(parsed.tool)) {
          return null;
        }
        return [parsed as ToolCall];
      }

      return null;
    } catch (error) {
      console.error('Failed to parse tool call:', error);
      console.error('Response was:', response);
      // Try one more time with even more aggressive cleaning
      try {
        let cleaned = response
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .replace(/^[^{\[\s]*/, '') // Remove anything before first { or [
          .trim();
        
        // Find the JSON content by locating the first [ or { and matching to the last ] or }
        const firstBracket = cleaned.indexOf('[');
        const firstBrace = cleaned.indexOf('{');
        let startIdx = -1;
        if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
          startIdx = firstBracket;
        } else if (firstBrace !== -1) {
          startIdx = firstBrace;
        }
        
        if (startIdx !== -1) {
          // Find matching closing bracket/brace
          let depth = 0;
          let inString = false;
          let escapeNext = false;
          let endIdx = startIdx;
          
          for (let i = startIdx; i < cleaned.length; i++) {
            const char = cleaned[i];
            
            if (escapeNext) {
              escapeNext = false;
              continue;
            }
            
            if (char === '\\') {
              escapeNext = true;
              continue;
            }
            
            if (char === '"') {
              inString = !inString;
              continue;
            }
            
            if (inString) continue;
            
            if (char === '[' || char === '{') {
              depth++;
            } else if (char === ']' || char === '}') {
              depth--;
              if (depth === 0) {
                endIdx = i + 1;
                break;
              }
            }
          }
          
          cleaned = cleaned.substring(startIdx, endIdx);
        }
        
        cleaned = cleaned
          .replace(/['']/g, "'")
          .replace(/[""]/g, '"')
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/[\u2018\u2019]/g, "'")
          .trim();
        
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          const toolCalls: ToolCall[] = [];
          for (const item of parsed) {
            if (item && typeof item === 'object' && 'tool' in item && 'args' in item) {
              if (['become_companion', 'respond_to_player', 'give_player_item', 'assign_quest'].includes(item.tool)) {
                toolCalls.push(item as ToolCall);
              }
            }
          }
          return toolCalls.length > 0 ? toolCalls : null;
        }
        if (parsed && typeof parsed === 'object' && 'tool' in parsed && 'args' in parsed) {
          if (['become_companion', 'respond_to_player', 'give_player_item', 'assign_quest'].includes(parsed.tool)) {
            return [parsed as ToolCall];
          }
        }
      } catch (retryError) {
        console.error('Retry parse also failed:', retryError);
      }
      return null;
    }
  }

  /**
   * Execute a tool call
   */
  executeTool(toolCall: ToolCall, context: ToolContext): ToolResult {
    const tool = TOOL_REGISTRY.find(t => t.name === toolCall.tool);
    
    if (!tool) {
      return {
        success: false,
        message: `Unknown tool: ${toolCall.tool}`,
      };
    }

    if (!tool.available(this, context)) {
      return {
        success: false,
        message: `Tool ${toolCall.tool} is not available in this context.`,
      };
    }

    // Validate required arguments
    for (const [argName, argSpec] of Object.entries(tool.args)) {
      if (argSpec.required !== false && !(argName in toolCall.args)) {
        return {
          success: false,
          message: `Missing required argument: ${argName}`,
        };
      }
    }

    return tool.execute(this, toolCall.args, context);
  }

  /**
   * Execute multiple tool calls
   */
  executeTools(toolCalls: ToolCall[], context: ToolContext): ToolResult[] {
    return toolCalls.map(toolCall => this.executeTool(toolCall, context));
  }

  /**
   * Estimate token count for a string (rough approximation: ~4 chars per token)
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Track token usage and check if context window is exceeded
   */
  trackTokens(text: string): void {
    const tokens = this.estimateTokens(text);
    this.usedTokens += tokens;
  }

  /**
   * Check if context window is getting full (warn at 80%)
   */
  isContextWindowFull(): boolean {
    return this.usedTokens > this.contextWindow * 0.8;
  }

  /**
   * Reset token tracking (call when starting new conversation or clearing history)
   */
  resetTokenTracking(): void {
    this.usedTokens = 0;
  }

  /**
   * Process a player message and decide on an action using tools
   * This is the main entry point for NPC decision-making
   * @param playerMessage The message from the player
   * @param context Tool context with game state
   * @returns Result containing either a tool execution result or a direct response
   */
  async decideAction(playerMessage: string, context: ToolContext): Promise<{
    success: boolean;
    message: string;
    toolUsed?: ToolName;
    toolResult?: ToolResult;
    allToolResults?: Array<{ tool: ToolName; result: ToolResult }>;
  }> {
    // Build context message for the AI (npc_state is already in system prompt)
    const worldState = this.buildWorldState(context, context.nearbyCharacters);
    
    // Include conversation history if available (limit to recent exchanges for context window)
    const recentHistory = context.conversationHistory 
      ? context.conversationHistory.slice(-6) // Last 6 messages (3 exchanges)
      : [];
    
    const contextMessage = JSON.stringify({
      world: worldState,
      conversation_history: recentHistory.length > 0 ? recentHistory : undefined,
      player_message: playerMessage,
    }, null, 2);

    // Build system prompt with tools
    const systemPrompt = this.buildCorePrompt(context.playerName, context, true);

    try {
      // Call the AI
      const response = await sendChatMessage(contextMessage, systemPrompt);
      
      // Track tokens used
      this.trackTokens(contextMessage);
      this.trackTokens(response);

      // Try to parse as tool call(s)
      const toolCalls = this.parseToolCall(response);
      
      if (toolCalls && toolCalls.length > 0) {
        // Execute all tools
        const toolResults = this.executeTools(toolCalls, context);
        
        // Combine messages from all tools
        const messages: string[] = [];
        const toolsUsed: ToolName[] = [];
        
        for (let i = 0; i < toolCalls.length; i++) {
          const toolCall = toolCalls[i];
          const toolResult = toolResults[i];
          toolsUsed.push(toolCall.tool);
          
          if (toolResult.success) {
            messages.push(toolResult.message);
          } else {
            messages.push(`[Failed to execute ${toolCall.tool}: ${toolResult.message}]`);
          }
        }
        
        // Find respond_to_player tool result for the main message
        // Only show respond_to_player message - other tools (assign_quest, give_player_item) are silent
        const respondToolIndex = toolCalls.findIndex(tc => tc.tool === 'respond_to_player');
        const mainMessage = respondToolIndex >= 0 && toolResults[respondToolIndex].success
          ? toolResults[respondToolIndex].message
          : messages.filter(m => m.trim().length > 0).join('\n\n'); // Filter out empty messages
        
        // Build all tool results array
        const allToolResults = toolCalls.map((tc, idx) => ({
          tool: tc.tool,
          result: toolResults[idx],
        }));
        
        return {
          success: toolResults.every(tr => tr.success),
          message: mainMessage,
          toolUsed: toolsUsed[0], // Return first tool for backwards compatibility
          toolResult: toolResults[respondToolIndex >= 0 ? respondToolIndex : 0],
          allToolResults,
        };
      } else {
        // If parsing failed, treat as direct response (fallback)
        return {
          success: true,
          message: `${this.name}: ${response}`,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Error processing action: ${errorMessage}`,
      };
    }
  }

  /**
   * Build world state description for tool context
   * @param context Tool context with game state
   * @param nearbyCharacters Optional list of nearby character IDs
   */
  private buildWorldState(context: ToolContext, nearbyCharacters?: string[]): string {
    const parts: string[] = [];
    
    if (context.isPlayerNearby) {
      parts.push('The player is nearby.');
    }
    
    // Add nearby characters (excluding self)
    if (nearbyCharacters && nearbyCharacters.length > 0) {
      const otherCharacters = nearbyCharacters
        .filter(id => id !== this.id)
        .map(id => characterRegistry[id]?.name)
        .filter(Boolean);
      if (otherCharacters.length > 0) {
        parts.push(`Other people nearby: ${otherCharacters.join(', ')}.`);
      }
    }
    
    if (context.companions && context.companions.length > 0) {
      const companionNames = context.companions
        .map(id => characterRegistry[id]?.name)
        .filter(Boolean);
      if (companionNames.length > 0) {
        parts.push(`Current companions: ${companionNames.join(', ')}.`);
      }
    }
    
    // Add world knowledge about herbs
    const herbs = getAllHerbs();
    if (herbs.length > 0) {
      const herbNames = herbs.map(h => h.name).join(', ');
      parts.push(`Known herbs in the world: ${herbNames}.`);
      
      // Add quest-specific herbs if relevant
      const questHerbs = herbs.filter(h => ['forest_herb', 'plains_herb', 'mountain_herb'].includes(h.id));
      if (questHerbs.length > 0) {
        const questHerbInfo = questHerbs.map(h => {
          const biome = h.id === 'forest_herb' ? 'forest' : h.id === 'plains_herb' ? 'plains' : 'mountain';
          return `${h.name} (found in ${biome} biomes)`;
        }).join(', ');
        parts.push(`Rare quest herbs: ${questHerbInfo}.`);
      }
    }
    
    return parts.length > 0 ? parts.join(' ') : 'You are in the game world.';
  }

}

// Tool Registry - Define all available tools
const TOOL_REGISTRY: ToolDefinition[] = [
  {
    name: 'update_biography',
    description: 'Update your biography or knowledge about yourself based on new information learned from conversations or questions. Use this when the player asks you something that should be remembered for consistency.',
    args: {
      new_biography: {
        type: 'string',
        description: 'The updated biography or knowledge about yourself that should be remembered',
        required: true,
      },
    },
    available: () => true, // All characters can update their biography
    execute: (character: Character, args: Record<string, unknown>, _context: ToolContext): ToolResult => {
      const newBiography = args.new_biography as string;
      
      if (!newBiography || typeof newBiography !== 'string') {
        return {
          success: false,
          message: 'Invalid biography update.',
        };
      }
      
      // Update the character's biography
      character.biography = newBiography;
      
      return {
        success: true,
        message: '', // Silent - the updated biography will be used in future conversations
        data: { biography: newBiography },
      };
    },
  },
  {
    name: 'research_world',
    description: 'Research and learn about the world, including available herbs, items, or other game knowledge. Use this when you need accurate information about what exists in the world.',
    args: {
      topic: {
        type: 'string',
        description: 'What to research (e.g., "herbs", "items", "quests")',
        required: true,
      },
    },
    available: () => true, // All characters can research
    execute: (_character: Character, args: Record<string, unknown>, _context: ToolContext): ToolResult => {
      const topic = args.topic as string;
      
      if (!topic || typeof topic !== 'string') {
        return {
          success: false,
          message: 'Invalid research topic.',
        };
      }
      
      let researchResult = '';
      
      if (topic.toLowerCase().includes('herb')) {
        const herbs = getAllHerbs();
        const herbInfo = herbs.map(h => {
          const biome = h.id === 'forest_herb' ? 'forest' : 
                       h.id === 'plains_herb' ? 'plains' : 
                       h.id === 'mountain_herb' ? 'mountain' : 
                       'various';
          return `${h.name} - ${h.description}${biome !== 'various' ? ` (found in ${biome} biomes)` : ''}`;
        }).join('\n');
        researchResult = `Available herbs:\n${herbInfo}`;
      } else if (topic.toLowerCase().includes('item')) {
        const items = getAllItems();
        researchResult = items.length > 0
          ? `Items in the world: ${items.map(i => i.name).join(', ')}`
          : 'No items are currently registered in the world.';
      } else {
        researchResult = `Research topic "${topic}" - information not available.`;
      }
      
      // Include research result in message so NPC can use it in their response
      return {
        success: true,
        message: researchResult, // Include research result so NPC can reference it
        data: { research: researchResult, topic },
      };
    },
  },
  {
    name: 'become_companion',
    description: 'Offer to become the player\'s companion and join them on their journey.',
    args: {},
    available: (character: Character) => {
      return character.canBeCompanion;
    },
    execute: (character: Character, _args: Record<string, unknown>, context: ToolContext): ToolResult => {
      if (!context.companions) {
        return {
          success: false,
          message: 'Companion system not initialized.',
        };
      }

      if (context.companions.includes(character.id)) {
        return {
          success: false,
          message: `${character.name} is already your companion.`,
        };
      }

      // Add to companions array
      context.companions.push(character.id);

      return {
        success: true,
        message: `${character.name} has joined you as a companion!`,
        data: { companionId: character.id },
      };
    },
  },
  {
    name: 'respond_to_player',
    description: 'Respond to the player with a message. Use this to have a conversation.',
    args: {
      message: {
        type: 'string',
        description: 'The message to say to the player',
        required: true,
      },
    },
    available: () => true, // Always available
    execute: (character: Character, args: Record<string, unknown>, _context: ToolContext): ToolResult => {
      const message = args.message as string;
      
      if (!message || typeof message !== 'string') {
        return {
          success: false,
          message: 'Invalid message argument.',
        };
      }

      return {
        success: true,
        message: `${character.name}: ${message}`,
        data: { message },
      };
    },
  },
  {
    name: 'give_player_item',
    description: 'Give an item from your inventory to the player.',
    args: {
      item_id: {
        type: 'string',
        description: 'The ID of the item to give',
        required: true,
      },
      quantity: {
        type: 'number',
        description: 'The quantity to give (default: 1)',
        required: false,
      },
    },
    available: (character: Character) => {
      // Available if character has any items
      return Object.keys(character.inventory).length > 0;
    },
    execute: (character: Character, args: Record<string, unknown>, context: ToolContext): ToolResult => {
      if (!context.playerInventory) {
        return {
          success: false,
          message: 'Player inventory not available.',
        };
      }

      const itemId = args.item_id as string;
      const quantity = (args.quantity as number) || 1;

      if (!itemId || typeof itemId !== 'string') {
        return {
          success: false,
          message: 'Invalid item_id argument.',
        };
      }

      return character.giveItemToPlayer(itemId, quantity, context.playerInventory);
    },
  },
  {
    name: 'assign_quest',
    description: 'Assign a quest to the player. Use this when offering quests or when the player asks about available quests.',
    args: {
      quest_id: {
        type: 'string',
        description: 'The ID of the quest to assign to the player',
        required: true,
      },
    },
    available: (character: Character, context?: ToolContext) => {
      // Available if character has quests that are not yet started
      if (!character.questIds || character.questIds.length === 0) {
        return false;
      }
      
      // Check if there are any NOT_STARTED quests that aren't already in activeQuests
      const availableQuests = character.questIds
        .map(questId => getQuest(questId))
        .filter((quest): quest is NonNullable<typeof quest> => {
          if (!quest || quest.giverId !== character.id) {
            return false;
          }
          
          // Quest must be NOT_STARTED
          if (quest.status !== QuestStatus.NOT_STARTED) {
            return false;
          }
          
          // Quest must not already be in activeQuests (already assigned)
          if (context?.activeQuests && context.activeQuests[quest.id]) {
            return false;
          }
          
          return true;
        });
      
      return availableQuests.length > 0;
    },
    execute: (character: Character, args: Record<string, unknown>, context: ToolContext): ToolResult => {
      const questId = args.quest_id as string;
      
      if (!questId || typeof questId !== 'string') {
        return {
          success: false,
          message: 'Invalid quest_id argument.',
        };
      }

      // Check if quest exists
      const quest = getQuest(questId);
      if (!quest) {
        return {
          success: false,
          message: `Quest "${questId}" does not exist.`,
        };
      }

      // Check if quest belongs to this character
      if (quest.giverId !== character.id) {
        return {
          success: false,
          message: `This quest does not belong to ${character.name}.`,
        };
      }

      // Check if quest is already assigned or completed
      if (quest.status === QuestStatus.IN_PROGRESS) {
        return {
          success: false,
          message: `Quest "${quest.title}" is already assigned to the player.`,
        };
      }

      if (quest.status === QuestStatus.COMPLETED) {
        return {
          success: false,
          message: `Quest "${quest.title}" has already been completed.`,
        };
      }

      // Check if already in activeQuests
      if (context.activeQuests && context.activeQuests[questId]) {
        return {
          success: false,
          message: `Quest "${quest.title}" is already active.`,
        };
      }

      // Don't start the quest yet - just offer it and wait for player acceptance
      // The quest will be started when the player accepts it

      // Build quest description
      const objectivesList = quest.objectives
        .map(obj => `- ${obj.description}`)
        .join('\n');
      
      let rewardsText = '';
      if (quest.rewards && quest.rewards.items) {
        const itemRewards = Object.entries(quest.rewards.items)
          .map(([itemId, qty]) => `${qty} ${getItemName(itemId)}`)
          .join(', ');
        if (itemRewards) {
          rewardsText = `\n\nRewards: ${itemRewards}`;
        }
      }

      return {
        success: true,
        message: '', // Silent success - quest details will be shown separately in UI
        data: { questId, quest, questTitle: quest.title, questDescription: quest.description, objectives: objectivesList, rewards: rewardsText },
      };
    },
  },
];


// Central registry of all characters in the game
export const characterRegistry: Record<string, Character> = {
  'grandma': new Character(
    'grandma',
    'Grandma',
    'Your a kind grandmother, always ready with advice and warm meals. Her passion now lies in tea, and she loves sharing her knowledge of herbs.',
    {
      openness: 0.6,
      conscientiousness: 0.9,
      extraversion: 0.7,
      agreeableness: 0.95,
      neuroticism: 0.2,
    },
    {
      canBeCompanion: false,
      biography: 'A loving grandmother who owned a bakery for many years, now retired and passionate about tea and herbs. Unfortunately you are not able to go out on adventures anymore.',
      job: 'owned a bakery',
      skills: { cooking: 10, gardening: 8, herbalism: 7, tea_blending: 9 },
      relationshipContext: {
        'grandpa': 'husband',
      },
      questIds: ['grandma_herb_collection'],
      inventory: {
        'fresh_apple_pie': 1,
      },
    }
  ),
  'grandpa': new Character(
    'grandpa',
    'Grandpa',
    'Your wise grandfather, full of stories from his adventures. A botanist who knows everything about plants. Unfortunately you are not able to go out on adventures anymore.',
    {
      openness: 0.8,
      conscientiousness: 0.7,
      extraversion: 0.85,
      agreeableness: 0.8,
      neuroticism: 0.1,
    },
    {
      canBeCompanion: false,
      biography: 'A botanist who studied plants all his life, now retired and sharing his knowledge with family.',
      job: 'botanist',
      skills: { botany: 10, storytelling: 9, survival: 8, plant_identification: 10 },
      relationshipContext: {
        'grandma': 'wife',
      },
      questIds: [],
      inventory: {},
    }
  ),
};

// Register a character in the central registry (used for generated NPCs)
export function registerCharacter(character: Character): void {
  characterRegistry[character.id.toLowerCase()] = character;
}

// Get a character by ID
export function getCharacter(id: string): Character | undefined {
  return characterRegistry[id.toLowerCase()];
}

// Get multiple characters by IDs
export function getCharacters(ids: string[]): Character[] {
  return ids
    .map(id => getCharacter(id))
    .filter((character): character is Character => character !== undefined);
}

// Check if a character can be a companion
export function canBeCompanion(characterId: string): boolean {
  const character = getCharacter(characterId);
  return character?.canBeCompanion ?? false;
}

/**
 * Get relationship summary for a character based on conversation history
 * Helps maintain relationship context within limited token budget
 */
export function getRelationshipSummary(
  characterId: string,
  conversationHistory?: { [key: string]: Array<{ role: 'user' | 'assistant'; content: string }> }
): string {
  if (!conversationHistory || !conversationHistory[characterId]) {
    return '';
  }

  const history = conversationHistory[characterId];
  const exchangeCount = Math.floor(history.length / 2);
  
  if (exchangeCount === 0) {
    return '';
  }

  // Simple relationship indicators based on conversation frequency
  if (exchangeCount < 3) {
    return 'You have just started talking.';
  } else if (exchangeCount < 10) {
    return 'You have been getting to know each other.';
  } else {
    return 'You have had many conversations together.';
  }
}

// Legacy exports for backwards compatibility during migration
export const Person = Character;
export const peopleRegistry = characterRegistry;
export function getPerson(id: string) { return getCharacter(id); }
export function getPeople(ids: string[]) { return getCharacters(ids); }