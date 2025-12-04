import type { CommandResult } from '../commandHandler';
import type { GameState } from '../gameState';

// Individual direction handlers
function handleNorth(state: GameState): CommandResult {
  return {
    success: true,
    message: 'You move north.',
    stateUpdate: {
      playerPosition: {
        ...state.playerPosition,
        y: state.playerPosition.y + 1,
      },
    },
  };
}

function handleSouth(state: GameState): CommandResult {
  return {
    success: true,
    message: 'You move south.',
    stateUpdate: {
      playerPosition: {
        ...state.playerPosition,
        y: state.playerPosition.y - 1,
      },
    },
  };
}

function handleEast(state: GameState): CommandResult {
  return {
    success: true,
    message: 'You move east.',
    stateUpdate: {
      playerPosition: {
        ...state.playerPosition,
        x: state.playerPosition.x + 1,
      },
    },
  };
}

function handleWest(state: GameState): CommandResult {
  return {
    success: true,
    message: 'You move west.',
    stateUpdate: {
      playerPosition: {
        ...state.playerPosition,
        x: state.playerPosition.x - 1,
      },
    },
  };
}

// Movement handler factory - we'll create specific handlers in commandHandler
export const movementHandlers = {
  n: handleNorth,
  north: handleNorth,
  s: handleSouth,
  south: handleSouth,
  e: handleEast,
  east: handleEast,
  w: handleWest,
  west: handleWest,
};
