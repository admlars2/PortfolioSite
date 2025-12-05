import type { CommandHandler } from '../commandHandler';
import { getBuildingOnTile, tileHasBuilding } from '../map';

export const handleEnter: CommandHandler = (_args, state) => {
  if (state.isInside) {
    return {
      success: false,
      message: `You are already inside ${state.currentLocation || 'a building'}.`,
    };
  }

  // Check if current tile has a building
  const { x, y } = state.playerPosition;
  
  if (!tileHasBuilding(x, y)) {
    return {
      success: false,
      message: 'There is no building here to enter.',
    };
  }

  const buildingName = getBuildingOnTile(x, y);
  
  if (!buildingName) {
    return {
      success: false,
      message: 'You cannot enter this building.',
    };
  }

  return {
    success: true,
    message: `You enter ${buildingName}.`,
    stateUpdate: {
      isInside: true,
      currentLocation: buildingName,
    },
  };
};

export const handleExit: CommandHandler = (_args, state) => {
  if (!state.isInside) {
    return {
      success: false,
      message: 'You are already outside.',
    };
  }

  const currentLocation = state.currentLocation || 'the building';
  
  return {
    success: true,
    message: `You exit ${currentLocation}.`,
    stateUpdate: {
      isInside: false,
      currentLocation: null,
    },
  };
};