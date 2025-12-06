// Person class and registry
export class Person {
  id: string;
  name: string;
  description: string;
  canBeCompanion: boolean;
  personality: string; // Core personality traits
  relationshipContext?: string; // Relationship context (e.g., "grandmother", "friend")
  
  constructor(
    id: string,
    name: string,
    description: string,
    personality: string,
    canBeCompanion: boolean = false,
    relationshipContext?: string
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.personality = personality;
    this.canBeCompanion = canBeCompanion;
    this.relationshipContext = relationshipContext;
  }

  /**
   * Build core system prompt for this character
   * Optimized for limited context windows
   */
  buildCorePrompt(playerName?: string): string {
    let prompt = `You are ${this.name}`;
    
    if (this.relationshipContext) {
      prompt += `, ${this.relationshipContext}`;
    }
    
    if (playerName) {
      prompt += ` to ${playerName}`;
    }
    
    prompt += `. ${this.description}. ${this.personality}`;
    prompt += ' Keep responses concise and in character.';
    
    return prompt;
  }
}

// Central registry of all people in the game
export const peopleRegistry: Record<string, Person> = {
  'grandma': new Person(
    'grandma',
    'Grandma',
    'Your kind grandmother, always ready with advice and warm meals.',
    'Warm, nurturing, caring. Speaks with gentle wisdom. Loves cooking and family stories.',
    true,
    'grandmother'
  ),
  'grandpa': new Person(
    'grandpa',
    'Grandpa',
    'Your wise grandfather, full of stories from his adventures.',
    'Wise, adventurous, enthusiastic storyteller. Offers sage advice with a twinkle in his eye.',
    true,
    'grandfather'
  ),
};

// Get a person by ID
export function getPerson(id: string): Person | undefined {
  return peopleRegistry[id.toLowerCase()];
}

// Get multiple people by IDs
export function getPeople(ids: string[]): Person[] {
  return ids
    .map(id => getPerson(id))
    .filter((person): person is Person => person !== undefined);
}

// Check if a person can be a companion
export function canBeCompanion(personId: string): boolean {
  const person = getPerson(personId);
  return person?.canBeCompanion ?? false;
}

/**
 * Get relationship summary for a person based on conversation history
 * Helps maintain relationship context within limited token budget
 */
export function getRelationshipSummary(
  personId: string,
  conversationHistory?: { [key: string]: Array<{ role: 'user' | 'assistant'; content: string }> }
): string {
  if (!conversationHistory || !conversationHistory[personId]) {
    return '';
  }

  const history = conversationHistory[personId];
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