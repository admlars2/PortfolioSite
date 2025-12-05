import type { CommandResult } from '../commandHandler';
import type { GameState } from '../gameState';
import { getVisibleTiles, getTileKey, getTileAt } from '../map';

// Individual direction handlers
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
  
  // Load all visible tiles from new position
  const visibleTiles = getVisibleTiles(newX, newY);
  const loadedTilesSet = new Set(state.tilesLoaded || []);
  visibleTiles.forEach(tile => {
    loadedTilesSet.add(getTileKey(tile.x, tile.y));
  });
  const updatedLoaded = Array.from(loadedTilesSet);
  
  // Mark current tile as visited
  const tileKey = getTileKey(newX, newY);
  const visitedTiles = state.visitedTiles || [];
  const updatedVisited = visitedTiles.includes(tileKey) 
    ? visitedTiles 
    : [...visitedTiles, tileKey];
  
  // Get tile info for location display
  const tile = getTileAt(newX, newY);
  const locationInfo = tile.description + (tile.buildingName ? `\n\nBuilding: ${tile.buildingName}` : '');
  
  return {
    success: true,
    message: 'You move north.\n\n' + locationInfo,
    stateUpdate: {
      playerPosition: newPosition,
      tilesLoaded: updatedLoaded,
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
  
  // Load all visible tiles from new position
  const visibleTiles = getVisibleTiles(newX, newY);
  const loadedTilesSet = new Set(state.tilesLoaded || []);
  visibleTiles.forEach(tile => {
    loadedTilesSet.add(getTileKey(tile.x, tile.y));
  });
  const updatedLoaded = Array.from(loadedTilesSet);
  
  // Mark current tile as visited
  const tileKey = getTileKey(newX, newY);
  const visitedTiles = state.visitedTiles || [];
  const updatedVisited = visitedTiles.includes(tileKey) 
    ? visitedTiles 
    : [...visitedTiles, tileKey];
  
  // Get tile info for location display
  const tile = getTileAt(newX, newY);
  const locationInfo = tile.description + (tile.buildingName ? `\n\nBuilding: ${tile.buildingName}` : '');
  
  return {
    success: true,
    message: 'You move south.\n\n' + locationInfo,
    stateUpdate: {
      playerPosition: newPosition,
      tilesLoaded: updatedLoaded,
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
  
  // Load all visible tiles from new position
  const visibleTiles = getVisibleTiles(newX, newY);
  const loadedTilesSet = new Set(state.tilesLoaded || []);
  visibleTiles.forEach(tile => {
    loadedTilesSet.add(getTileKey(tile.x, tile.y));
  });
  const updatedLoaded = Array.from(loadedTilesSet);
  
  // Mark current tile as visited
  const tileKey = getTileKey(newX, newY);
  const visitedTiles = state.visitedTiles || [];
  const updatedVisited = visitedTiles.includes(tileKey) 
    ? visitedTiles 
    : [...visitedTiles, tileKey];
  
  // Get tile info for location display
  const tile = getTileAt(newX, newY);
  const locationInfo = tile.description + (tile.buildingName ? `\n\nBuilding: ${tile.buildingName}` : '');
  
  return {
    success: true,
    message: 'You move east.\n\n' + locationInfo,
    stateUpdate: {
      playerPosition: newPosition,
      tilesLoaded: updatedLoaded,
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
  
  // Load all visible tiles from new position
  const visibleTiles = getVisibleTiles(newX, newY);
  const loadedTilesSet = new Set(state.tilesLoaded || []);
  visibleTiles.forEach(tile => {
    loadedTilesSet.add(getTileKey(tile.x, tile.y));
  });
  const updatedLoaded = Array.from(loadedTilesSet);
  
  // Mark current tile as visited
  const tileKey = getTileKey(newX, newY);
  const visitedTiles = state.visitedTiles || [];
  const updatedVisited = visitedTiles.includes(tileKey) 
    ? visitedTiles 
    : [...visitedTiles, tileKey];
  
  // Get tile info for location display
  const tile = getTileAt(newX, newY);
  const locationInfo = tile.description + (tile.buildingName ? `\n\nBuilding: ${tile.buildingName}` : '');
  
  return {
    success: true,
    message: 'You move west.\n\n' + locationInfo,
    stateUpdate: {
      playerPosition: newPosition,
      tilesLoaded: updatedLoaded,
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
