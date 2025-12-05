import type { CommandHandler } from '../commandHandler';
import type { GameState } from '../gameState';
import { initializeMap } from '../map';

export const handleSeed: CommandHandler = (args, state: GameState) => {
  // Only allow if player name is "debug"
  if (state.playerName?.toLowerCase() !== 'debug') {
    return {
      success: false,
      message: 'Unknown command. Type "help" for a list of commands.',
    };
  }

  if (args.length === 0) {
    return {
      success: true,
      message: `Current map seed: ${state.mapSeed || 'not set'}\n\nUsage: seed <new_seed>`,
    };
  }

  const newSeed = args.join(' ');
  
  if (!newSeed || newSeed.trim().length === 0) {
    return {
      success: false,
      message: 'Please provide a valid seed.',
    };
  }

  const mapConfig = initializeMap(newSeed.trim());
  
  return {
    success: true,
    message: `Map seed set to: ${mapConfig.seed}`,
    stateUpdate: {
      mapSeed: mapConfig.seed,
    },
  };
};

