// Person class and registry
export class Person {
  id: string;
  name: string;
  description: string;
  canBeCompanion: boolean;
  // Add more fields as needed for future features
  // e.g., dialogue, quests, relationships, etc.

  constructor(
    id: string,
    name: string,
    description: string,
    canBeCompanion: boolean = false
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.canBeCompanion = canBeCompanion;
  }
}

// Central registry of all people in the game
export const peopleRegistry: Record<string, Person> = {
  'grandma': new Person(
    'grandma',
    'Grandma',
    'Your kind grandmother, always ready with advice and warm meals.',
    true
  ),
  'grandpa': new Person(
    'grandpa',
    'Grandpa',
    'Your wise grandfather, full of stories from his adventures.',
    true
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