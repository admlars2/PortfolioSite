import type { CommandResult } from '../commandHandler';
import type { GameState } from '../gameState';
import { getVisibleTiles, getTileKey, getTileAt, getAllTiles, getNPCsOnTile } from '../map';

// Individual direction handlers
function buildNearbyNPCNotice(x: number, y: number, state: GameState): string {
  const companionIds = state.companions.map(id => id.toLowerCase());
  const companionsSet = new Set(companionIds);
  const npcs = getNPCsOnTile(x, y, state.mapSeed).filter(npc => !companionsSet.has(npc.id.toLowerCase()));

  if (npcs.length === 0) {
    return '';
  }

  if (npcs.length === 1) {
    return `${npcs[0].name} is nearby.`;
  }

  const names = npcs.map(npc => npc.name).join(', ');
  return `You sense people nearby: ${names}.`;
}

function handleNorth(state: GameState): CommandResult {
  if (state.isInside) {
    return {
      success: false,
      message: 'You cannot move around inside. Type "exit" to leave.',
    };
  }
  
  const newY = state.playerPosition.y + 1;
  const newX = state.playerPosition.x;
  const newPosition = { x: newX, y: newY };
  
  // Load all visible tiles from new position (this generates them if needed)
  getVisibleTiles(newX, newY);
  
  // Mark current tile as visited
  const tileKey = getTileKey(newX, newY);
  const visitedTiles = state.visitedTiles || [];
  const updatedVisited = visitedTiles.includes(tileKey) 
    ? visitedTiles 
    : [...visitedTiles, tileKey];
  
  // Get tile info for location display
  const tile = getTileAt(newX, newY);
  const locationInfo = tile.description + (tile.buildingName ? `\n\nBuilding: ${tile.buildingName}` : '');
  const nearbyNotice = buildNearbyNPCNotice(newX, newY, state);
  const combinedInfo = nearbyNotice ? `${locationInfo}\n\n${nearbyNotice}` : locationInfo;
  
  // Save all tiles from registry (includes newly generated ones)
  const savedTiles = getAllTiles();
  
  return {
    success: true,
    message: 'You move north.\n\n' + combinedInfo,
    stateUpdate: {
      playerPosition: newPosition,
      savedTiles,
      visitedTiles: updatedVisited,
    },
  };
}

function handleSouth(state: GameState): CommandResult {
  if (state.isInside) {
    return {
      success: false,
      message: 'You cannot move around inside. Type "exit" to leave.',
    };
  }
  
  const newY = state.playerPosition.y - 1;
  const newX = state.playerPosition.x;
  const newPosition = { x: newX, y: newY };
  
  // Load all visible tiles from new position (this generates them if needed)
  getVisibleTiles(newX, newY);
  
  // Mark current tile as visited
  const tileKey = getTileKey(newX, newY);
  const visitedTiles = state.visitedTiles || [];
  const updatedVisited = visitedTiles.includes(tileKey) 
    ? visitedTiles 
    : [...visitedTiles, tileKey];
  
  // Get tile info for location display
  const tile = getTileAt(newX, newY);
  const locationInfo = tile.description + (tile.buildingName ? `\n\nBuilding: ${tile.buildingName}` : '');
  const nearbyNotice = buildNearbyNPCNotice(newX, newY, state);
  const combinedInfo = nearbyNotice ? `${locationInfo}\n\n${nearbyNotice}` : locationInfo;
  
  // Save all tiles from registry (includes newly generated ones)
  const savedTiles = getAllTiles();
  
  return {
    success: true,
    message: 'You move south.\n\n' + combinedInfo,
    stateUpdate: {
      playerPosition: newPosition,
      savedTiles,
      visitedTiles: updatedVisited,
    },
  };
}

function handleEast(state: GameState): CommandResult {
  if (state.isInside) {
    return {
      success: false,
      message: 'You cannot move around inside. Type "exit" to leave.',
    };
  }
  
  const newX = state.playerPosition.x + 1;
  const newY = state.playerPosition.y;
  const newPosition = { x: newX, y: newY };
  
  // Load all visible tiles from new position (this generates them if needed)
  getVisibleTiles(newX, newY);
  
  // Mark current tile as visited
  const tileKey = getTileKey(newX, newY);
  const visitedTiles = state.visitedTiles || [];
  const updatedVisited = visitedTiles.includes(tileKey) 
    ? visitedTiles 
    : [...visitedTiles, tileKey];
  
  // Get tile info for location display
  const tile = getTileAt(newX, newY);
  const locationInfo = tile.description + (tile.buildingName ? `\n\nBuilding: ${tile.buildingName}` : '');
  const nearbyNotice = buildNearbyNPCNotice(newX, newY, state);
  const combinedInfo = nearbyNotice ? `${locationInfo}\n\n${nearbyNotice}` : locationInfo;
  
  // Save all tiles from registry (includes newly generated ones)
  const savedTiles = getAllTiles();
  
  return {
    success: true,
    message: 'You move east.\n\n' + combinedInfo,
    stateUpdate: {
      playerPosition: newPosition,
      savedTiles,
      visitedTiles: updatedVisited,
    },
  };
}

function handleWest(state: GameState): CommandResult {
  if (state.isInside) {
    return {
      success: false,
      message: 'You cannot move around inside. Type "exit" to leave.',
    };
  }
  
  const newX = state.playerPosition.x - 1;
  const newY = state.playerPosition.y;
  const newPosition = { x: newX, y: newY };
  
  // Load all visible tiles from new position (this generates them if needed)
  getVisibleTiles(newX, newY);
  
  // Mark current tile as visited
  const tileKey = getTileKey(newX, newY);
  const visitedTiles = state.visitedTiles || [];
  const updatedVisited = visitedTiles.includes(tileKey) 
    ? visitedTiles 
    : [...visitedTiles, tileKey];
  
  // Get tile info for location display
  const tile = getTileAt(newX, newY);
  const locationInfo = tile.description + (tile.buildingName ? `\n\nBuilding: ${tile.buildingName}` : '');
  const nearbyNotice = buildNearbyNPCNotice(newX, newY, state);
  const combinedInfo = nearbyNotice ? `${locationInfo}\n\n${nearbyNotice}` : locationInfo;
  
  // Save all tiles from registry (includes newly generated ones)
  const savedTiles = getAllTiles();
  
  return {
    success: true,
    message: 'You move west.\n\n' + combinedInfo,
    stateUpdate: {
      playerPosition: newPosition,
      savedTiles,
      visitedTiles: updatedVisited,
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
