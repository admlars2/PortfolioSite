import type { PlayerStats } from './player';
import { defaultPlayerStats, Inventory } from './player';
import type { TileData } from './map';
import { getAllTiles } from './map';
import type { Quest } from './quests';

export interface ConversationHistory {
  [personId: string]: Array<{ role: 'user' | 'npc'; content: string }>;
}

export interface GameState {
  playerName?: string;
  playerPosition: {
    x: number;
    y: number;
  };
  audioEnabled: boolean;
  audioVolume: number;
  mapSeed?: string;
  isInside: boolean;
  currentLocation: string | null;
  companions: string[]; // Array of person IDs
  gold: number;
  playerStats: PlayerStats;
  inventory: Inventory;
  savedTiles: { [tileKey: string]: TileData }; // Actual tile data saved by tile key
  visitedTiles: string[]; // Array of tile keys - tiles the player has visited
  conversationHistory?: ConversationHistory; // Chat history with characters (keyed by person ID)
  activeQuests?: { [questId: string]: Quest }; // Active quests (in progress or completed)
}

export const initialGameState: GameState = {
  playerPosition: {
    x: 0,
    y: 0,
  },
  audioEnabled: true,
  audioVolume: 0.5,
  isInside: true,
  currentLocation: "grandma's house",
  companions: [],
  gold: 100,
  playerStats: { ...defaultPlayerStats },
  inventory: new Inventory(),
  savedTiles: {}, // Start with empty tiles - will be populated as tiles are generated
  visitedTiles: ['0,0'], // Start with home visited
  conversationHistory: {}, // Initialize empty conversation history (keyed by person ID)
  activeQuests: {}, // Initialize empty quests
};

export function createGameState(): GameState {
  // Load from localStorage if available
  const saved = localStorage.getItem('herb-search-game-state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Ensure new fields are present for old saves
      const state = { 
        ...initialGameState, 
        ...parsed,
        // Default to grandma's house if location fields are missing
        isInside: parsed.isInside !== undefined ? parsed.isInside : true,
        currentLocation: parsed.currentLocation || "grandma's house",
        // Handle migration from old companion field to new companions array
        companions: parsed.companions || (parsed.companion ? [parsed.companion] : []),
        // Handle player stats migration
        playerStats: parsed.playerStats || { ...defaultPlayerStats },
      gold: parsed.gold !== undefined ? parsed.gold : 100,
        // Handle inventory migration
        inventory: parsed.inventory 
          ? Inventory.fromJSON(parsed.inventory) 
          : new Inventory(),
        // Handle player name migration
        playerName: parsed.playerName || undefined,
        // Handle tiles migration - support both old (tilesLoaded) and new (savedTiles) formats
        savedTiles: parsed.savedTiles || {},
        visitedTiles: parsed.visitedTiles || ['0,0'],
        // Handle conversation history migration (keyed by person ID)
        conversationHistory: parsed.conversationHistory || {},
        // Handle quests migration - ensure quests are properly restored
        activeQuests: parsed.activeQuests || {},
      };
      
      // Ensure inventory is properly restored as Inventory instance
      if (state.inventory && !(state.inventory instanceof Inventory)) {
        state.inventory = Inventory.fromJSON(state.inventory as any);
      }
      
      return state;
    } catch {
      return initialGameState;
    }
  }
  return initialGameState;
}

export function saveGameState(state: GameState): void {
  // Convert inventory to JSON format for storage
  // Include all tiles from registry in saved state
  // activeQuests will be serialized automatically (plain objects)
  const stateToSave = {
    ...state,
    inventory: state.inventory.toJSON(),
    savedTiles: getAllTiles(), // Save all tiles from registry
    activeQuests: state.activeQuests || {}, // Explicitly ensure activeQuests is saved
  };
  localStorage.setItem('herb-search-game-state', JSON.stringify(stateToSave));
}