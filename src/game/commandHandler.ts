import type { GameState } from './gameState';
import { movementHandlers } from './commands/movement';
import { handleHelp } from './commands/help';
import { handleAudio } from './commands/audio';
import { handleMap } from './commands/map';
import { handleEnter, handleExit } from './commands/location';
import { handlePeople } from './commands/people';
import { handleStats } from './commands/stats';
import { handleInventory } from './commands/inventory';
import { handleLook } from './commands/look';
import { handleSeed } from './commands/seed';
import { handleClear, resetClearConfirmations } from './commands/clear';
import { handleTalk } from './commands/talk';

export interface CommandResult {
  success: boolean;
  message: string;
  stateUpdate?: Partial<GameState>;
  updateState?: GameState; // Full state update (for async handlers that modify state)
}

export type CommandHandler = (
  args: string[],
  state: GameState
) => CommandResult | Promise<CommandResult>;

const commandHandlers: Record<string, CommandHandler> = {
  // Movement commands
  n: (_, state) => movementHandlers.n(state),
  s: (_, state) => movementHandlers.s(state),
  e: (_, state) => movementHandlers.e(state),
  w: (_, state) => movementHandlers.w(state),
  north: (_, state) => movementHandlers.north(state),
  south: (_, state) => movementHandlers.south(state),
  east: (_, state) => movementHandlers.east(state),
  west: (_, state) => movementHandlers.west(state),
  
  // Help command
  help: handleHelp,
  h: handleHelp,
  '?': handleHelp,
  
  // Audio settings
  audio: handleAudio,
  sound: handleAudio,
  
  // Map command
  map: handleMap,
  
  // Location commands
  enter: handleEnter,
  exit: handleExit,
  leave: handleExit,
  
  // Location command (replaces look)
  location: handleLook,
  loc: handleLook,
  look: handleLook, // Keep for backwards compatibility
  
  // People command
  people: handlePeople,
  p: handlePeople,
  
  // Talk command
  talk: handleTalk,
  t: handleTalk,
  
  // Stats command
  stats: handleStats,
  status: handleStats,
  
  // Inventory command
  inventory: handleInventory,
  inv: handleInventory,
  i: handleInventory,
  
  // Debug commands
  seed: handleSeed,
  
  // Clear save command
  clear: handleClear,
  clearsave: handleClear,
};

export function parseCommand(input: string): { command: string; args: string[] } {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    return { command: '', args: [] };
  }
  
  const parts = trimmed.split(/\s+/);
  return {
    command: parts[0],
    args: parts.slice(1),
  };
}

export function executeCommand(
  input: string,
  state: GameState
): CommandResult | Promise<CommandResult> {
  const { command, args } = parseCommand(input);
  
  if (!command) {
    return {
      success: false,
      message: 'Please enter a command.',
    };
  }
  
  // Reset clear confirmations if any other command is executed
  if (command !== 'clear' && command !== 'clearsave') {
    resetClearConfirmations();
  }
  
  const handler = commandHandlers[command];
  if (!handler) {
    return {
      success: false,
      message: `Unknown command: "${command}". Type "help" for a list of commands.`,
    };
  }
  
  return handler(args, state);
}

