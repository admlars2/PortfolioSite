import { createNoise2D } from 'simplex-noise';
import seedrandom from 'seedrandom';
import { getCharacters, type Character } from './person';
import { ensureTileNPCs } from './npcGenerator';

// Tile system - consolidated

export interface TileAction {
  command: string;
  description: string;
}

export type BiomeType = 'plains' | 'forest' | 'mountain';

export interface TileData {
  x: number;
  y: number;
  description: string;
  display: string; // Character to display on map (e.g., '.', 'B', 'H', 'M')
  buildingName?: string; // Name of building/room on this tile
  buildingDescription?: string; // Description of the building
  actions: TileAction[]; // Available actions/commands on this tile
  priority: number; // Priority for zoomed-out map display (higher = more important)
  biome?: BiomeType; // Biome type of this tile
  assignedHerb?: string; // Herb ID assigned to this tile (if foraged)
  npcIds?: string[]; // Generated NPC ids tied to this tile (outside encounters)
}

// Tile registry - maps coordinates to tile data
const tileRegistry = new Map<string, TileData>();

// Global noise function for terrain generation (initialized with default seed)
let mapNoiseFunction: ((x: number, y: number) => number) | null = null;

/**
 * Load tiles from saved game state into the registry
 */
export function loadTilesFromState(savedTiles: { [tileKey: string]: TileData }): void {
  for (const [key, tile] of Object.entries(savedTiles)) {
    tileRegistry.set(key, tile);
  }
}

/**
 * Get all tiles currently in the registry as an object (for saving)
 */
export function getAllTiles(): { [tileKey: string]: TileData } {
  const tiles: { [tileKey: string]: TileData } = {};
  for (const [key, tile] of tileRegistry.entries()) {
    tiles[key] = tile;
  }
  return tiles;
}

// Initialize noise function with a seed
export function initializeMapNoise(seed: string): void {
  mapNoiseFunction = createMapNoise(seed);
}

// Get or create noise function (uses default seed if not initialized)
function getNoiseFunction(): (x: number, y: number) => number {
  if (!mapNoiseFunction) {
    // Initialize with default seed if not already set
    mapNoiseFunction = createMapNoise('default-map-seed');
  }
  return mapNoiseFunction;
}

// Helper to create tile key from coordinates
export function getTileKey(x: number, y: number): string {
  return `${x},${y}`;
}

// Register a tile
export function registerTile(tile: TileData): void {
  const key = getTileKey(tile.x, tile.y);
  tileRegistry.set(key, tile);
}

// Check if a tile exists in the registry (without generating it)
export function tileExists(x: number, y: number): boolean {
  const key = getTileKey(x, y);
  return tileRegistry.has(key);
}

// Get tile at coordinates (returns existing or generates a new plains tile)
export function getTileAt(x: number, y: number): TileData {
  const key = getTileKey(x, y);
  const existing = tileRegistry.get(key);
  
  if (existing) {
    return existing;
  }
  
  // Generate a new tile using simplex noise to determine terrain type
  const noise = getNoiseFunction();
  const noiseValue = noise(x * 0.1, y * 0.1); // Scale coordinates for better noise patterns
  
  // Calculate distance from center (0,0) for mountain placement
  const distanceFromCenter = Math.sqrt(x * x + y * y);
  
  // Mountains appear far from center (distance > 5) and with high noise value
  const isMountain = distanceFromCenter > 5 && noiseValue > 0.3;
  // Forest if noise > 0 and not mountain
  const isForest = !isMountain && noiseValue > 0;
  
  const newTile: TileData = isMountain ? {
    x,
    y,
    description: "Rugged mountain terrain with rocky outcrops and sparse vegetation.",
    display: 'M', // Mountain marker
    actions: [],
    priority: 2, // Mountains have highest priority
    biome: 'mountain',
  } : isForest ? {
    x,
    y,
    description: "A dense forest with tall trees and dappled sunlight filtering through the canopy.",
    display: 'F', // Forest marker
    actions: [],
    priority: 1, // Forest has slightly higher priority than plains
    biome: 'forest',
  } : {
    x,
    y,
    description: "A peaceful plains area with tall grass swaying in the breeze.",
    display: '.',
    actions: [],
    priority: 0, // Plains have lowest priority
    biome: 'plains',
  };
  
  registerTile(newTile);
  return newTile;
}

// Get all tiles within visible radius (Manhattan distance <= 3)
export function getVisibleTiles(playerX: number, playerY: number): TileData[] {
  const tiles: TileData[] = [];
  const radius = 3;
  
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const manhattanDistance = Math.abs(x) + Math.abs(y);
      
      // Only include tiles within radius (diamond shape)
      if (manhattanDistance <= radius) {
        const worldX = playerX + x;
        const worldY = playerY + y;
        tiles.push(getTileAt(worldX, worldY));
      }
    }
  }
  
  return tiles;
}

// Check if tile has a building/room
export function tileHasBuilding(x: number, y: number): boolean {
  const tile = getTileAt(x, y);
  return tile?.buildingName !== undefined;
}

// Get building name on tile
export function getBuildingOnTile(x: number, y: number): string | undefined {
  const tile = getTileAt(x, y);
  return tile?.buildingName;
}

// Get NPCs that belong to the current tile (for outdoor encounters)
export function getNPCsOnTile(x: number, y: number, mapSeed?: string): Character[] {
  const tile = getTileAt(x, y);
  return ensureTileNPCs(tile, mapSeed);
}

// Initialize default tiles
export function initializeTiles(): void {
  // Starting location - grandma's house at (0, 0)
  registerTile({
    x: 0,
    y: 0,
    description: "You are standing outside a cozy cottage. The garden is well-tended with various herbs growing along the path.",
    display: 'H', // Home marker
    buildingName: "grandma's house",
    buildingDescription: "A warm, welcoming cottage with a thatched roof and flower boxes in the windows.",
    actions: [
      { command: "enter", description: "Enter grandma's house" },
    ],
    priority: 10, // Buildings have high priority
  });
}

// Initialize tiles on module load
initializeTiles();

// Location system - stores person IDs for each location

export interface LocationData {
  name: string;
  peopleIds: string[];
}

// Define people in different locations by their IDs
export const locationData: Record<string, LocationData> = {
  "grandma's house": {
    name: "grandma's house",
    peopleIds: ['grandma', 'grandpa'],
  },
  // Add more locations as needed
  // "town square": {
  //   name: "town square",
  //   peopleIds: ['merchant'],
  // },
};

// Get characters in a specific location
export function getPeopleInLocation(locationName: string | null, isInside: boolean): Character[] {
  if (!isInside || !locationName) {
    // When outside, return empty array for now
    // Later we can add nearby people based on player position
    return [];
  }
  
  const location = locationData[locationName.toLowerCase()];
  if (!location) {
    return [];
  }
  
  return getCharacters(location.peopleIds);
}

// Get all characters nearby (in current location + companions)
export function getNearbyPeople(
  locationName: string | null, 
  isInside: boolean, 
  companionIds: string[],
  playerPosition?: { x: number; y: number },
  mapSeed?: string
): Character[] {
  const locationPeople = getPeopleInLocation(locationName, isInside);
  
  // Add companions to the list if they're with you
  const companions = getCharacters(companionIds);
  
  // Combine location characters and companions, avoiding duplicates
  const allCharacters = new Map<string, Character>();
  
  // Add location characters
  locationPeople.forEach((character: Character) => {
    allCharacters.set(character.id.toLowerCase(), character);
  });
  
  // Add companions (they override location characters if same character)
  companions.forEach((character: Character) => {
    allCharacters.set(character.id.toLowerCase(), character);
  });

  // Add outdoor NPCs tied to the tile the player is standing on
  if (!isInside && playerPosition) {
    const roamingNPCs = getNPCsOnTile(playerPosition.x, playerPosition.y, mapSeed);
    roamingNPCs.forEach((character: Character) => {
      allCharacters.set(character.id.toLowerCase(), character);
    });
  }
  
  return Array.from(allCharacters.values());
}

// Check if a person is in a specific location
export function isPersonInLocation(personId: string, locationName: string | null): boolean {
  if (!locationName) {
    return false;
  }
  
  const location = locationData[locationName.toLowerCase()];
  if (!location) {
    return false;
  }
  
  return location.peopleIds.some(id => id.toLowerCase() === personId.toLowerCase());
}

// Map configuration
export interface MapConfig {
  seed: string;
  width: number;
  height: number;
}

// Initialize map with random seed
export function initializeMap(seed?: string): MapConfig {
  const mapSeed = seed || generateRandomSeed();
  
  // Initialize noise function with the seed
  initializeMapNoise(mapSeed);
  
  return {
    seed: mapSeed,
    width: 100, // Will be configurable later
    height: 100, // Will be configurable later
  };
}

// Generate a random seed string
export function generateRandomSeed(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Create a seeded random number generator
export function createSeededRNG(seed: string) {
  return seedrandom(seed);
}

// Create a seeded noise function for the map
export function createMapNoise(seed: string) {
  const rng = createSeededRNG(seed);
  // Create a custom random function for simplex-noise
  const customRandom = () => rng();
  return createNoise2D(customRandom);
}

// Render map as 9x9 grid (one character per tile)
export function renderMap(
  playerX: number, 
  playerY: number, 
  loadedTiles: string[],
  zoomLevel: number = 1
): string {
  // Convert loaded tiles to a set to avoid repeated O(n) lookups while rendering
  const loadedTileSet = new Set(loadedTiles);
  const loadRadius = 3; // Radius for loading/generating new tiles (Manhattan distance)
  
  const output: string[] = [];
  
  // Placeholder for compass at the top (will be updated after calculating center)
  output.push('');
  output.push('');
  
  // Determine consolidation size based on zoom level
  const consolidationSize = zoomLevel === 2 ? 3 : zoomLevel === 3 ? 5 : 1;
  const displaySize = 9; // Always display 9x9 tiles
  
  // Calculate how many tiles we need to scan
  const scanRange = displaySize * consolidationSize;
  const scanHalfSize = Math.floor(scanRange / 2);
  
  // First pass: collect all tiles
  const allTiles: Array<Array<{ relX: number; worldX: number; worldY: number; char: string; tile?: TileData }>> = [];
  
  for (let relY = scanHalfSize; relY >= -scanHalfSize; relY--) {
    const worldY = playerY + relY;
    const rowTiles: Array<{ relX: number; worldX: number; worldY: number; char: string; tile?: TileData }> = [];
    
    // Collect tiles in this row
    for (let relX = -scanHalfSize; relX <= scanHalfSize; relX++) {
      const worldX = playerX + relX;
      const manhattanDistance = Math.abs(relX) + Math.abs(relY);
      const key = getTileKey(worldX, worldY);
        const isLoaded = loadedTileSet.has(key);
      const tileExistsInRegistry = tileExists(worldX, worldY);
      const isWithinLoadRadius = manhattanDistance <= loadRadius;
      
      let char = ' '; // Default to blank for unloaded tiles
      let tile: TileData | undefined = undefined;
      
      if (worldX === playerX && worldY === playerY) {
        // Player position
        char = '@';
      } else if (isLoaded) {
        // If tile is in loadedTiles, ensure it exists in registry (restore if needed)
        tile = getTileAt(worldX, worldY); // This will restore the tile if needed
        char = tile.display;
      } else if (tileExistsInRegistry) {
        // Show tiles that exist in registry even if not in loadedTiles (for backward compatibility)
        tile = tileRegistry.get(key)!;
        char = tile.display;
      } else if (isWithinLoadRadius) {
        // Within load radius but not loaded - generate new tile
        tile = getTileAt(worldX, worldY);
        char = tile.display;
      }
      // Otherwise, leave as blank space (outside load radius and not previously loaded)
      
      rowTiles.push({ relX, worldX, worldY, char, tile });
    }
    
    allTiles.push(rowTiles);
  }
  
  // Consolidate tiles if needed (zoom level 2 or 3)
  let finalRows: Array<{ relY: number; worldY: number; tiles: Array<{ relX: number; worldX: number; char: string }> }> = [];
  
  if (zoomLevel === 1) {
    // No consolidation, just show center 9x9 tiles
    const centerRowIndex = Math.floor(allTiles.length / 2);
    const startRow = centerRowIndex - Math.floor(displaySize / 2);
    const endRow = startRow + displaySize;
    
    for (let i = startRow; i < endRow && i < allTiles.length; i++) {
      const row = allTiles[i];
      const centerTileIndex = Math.floor(row.length / 2);
      const startCol = centerTileIndex - Math.floor(displaySize / 2);
      const endCol = startCol + displaySize;
      
      const relY = Math.floor(displaySize / 2) - (i - startRow);
      const displayTiles = row.slice(startCol, endCol).map(t => ({ 
        relX: t.relX, 
        worldX: t.worldX, 
        char: t.char 
      }));
      
      finalRows.push({
        relY,
        worldY: row[centerTileIndex].worldY,
        tiles: displayTiles,
      });
    }
  } else {
    // Consolidate blocks: process in groups of consolidationSize
    // Process from north to south: rowBlock 0 = north, rowBlock 8 = south
    for (let rowBlock = 0; rowBlock < displaySize; rowBlock++) {
      const consolidatedTiles: Array<{ relX: number; worldX: number; char: string }> = [];
      
      // Get the rows for this block
      const startRow = rowBlock * consolidationSize;
      const blockRows = allTiles.slice(startRow, startRow + consolidationSize);
      
      if (blockRows.length === 0) break;
      
      // Process columns in blocks
      for (let colBlock = 0; colBlock < displaySize; colBlock++) {
        const startCol = colBlock * consolidationSize;
        
        // Collect all tiles from this consolidation block
        const blockTiles: Array<{ tile: TileData | undefined; char: string; worldX: number; worldY: number }> = [];
        
        for (const row of blockRows) {
          for (let col = startCol; col < startCol + consolidationSize && col < row.length; col++) {
            const tileData = row[col];
            blockTiles.push({
              tile: tileData.tile,
              char: tileData.char,
              worldX: tileData.worldX,
              worldY: tileData.worldY,
            });
          }
        }
        
        if (blockTiles.length === 0) continue;
        
        // Find tile with highest priority
        let highestPriority = -1;
        let chosenChar = ' ';
        
        // Check if player is in this block
        let playerInBlock = false;
        for (const { worldX, worldY } of blockTiles) {
          if (worldX === playerX && worldY === playerY) {
            chosenChar = '@';
            playerInBlock = true;
            break;
          }
        }
        
        if (!playerInBlock) {
          for (const { tile, char } of blockTiles) {
            if (char === ' ') continue; // Skip blank tiles
            
            const priority = tile?.priority ?? 0;
            
            if (priority > highestPriority) {
              highestPriority = priority;
              chosenChar = char;
            } else if (priority === highestPriority && char !== ' ') {
              // If same priority, prefer non-blank
              chosenChar = char;
            }
          }
        }
        
        // Calculate average position for consolidated tile
        const avgX = Math.floor(blockTiles.reduce((sum, t) => sum + t.worldX, 0) / blockTiles.length);
        const avgRelX = colBlock - Math.floor(displaySize / 2);
        
        consolidatedTiles.push({
          relX: avgRelX,
          worldX: avgX,
          char: chosenChar,
        });
      }
      
      // Calculate relY: allTiles[0] is north (positive relY), so we need to reverse the rowBlock order
      // rowBlock 0 should be north (positive relY), rowBlock 8 should be south (negative relY)
      const relY = Math.floor(displaySize / 2) - rowBlock;
      const centerTile = blockRows[Math.floor(blockRows.length / 2)];
      const centerTileIndex = Math.floor(centerTile.length / 2);
      
      finalRows.push({
        relY,
        worldY: centerTile[centerTileIndex].worldY,
        tiles: consolidatedTiles,
      });
    }
    
    // Rows are added in order: rowBlock 0 (north, relY=4) to rowBlock 8 (south, relY=-4)
    // This is already the correct order for display (north to south)
    // No need to sort or reverse
  }
  
  // Find the maximum row width for centering
  const maxRowWidth = Math.max(...finalRows.map(row => row.tiles.length));
  
  // Calculate center position for N/S labels
  // Center row format: "W---" (4) + tiles (maxRowWidth * 2) + "---E" (4)
  // Center is at: 4 + maxRowWidth
  const centerPosition = 4 + maxRowWidth;
  const nLabelPadding = centerPosition; // Center the 'N' character
  
  // Add compass at the top (centered)
  output[0] = ' '.repeat(nLabelPadding) + 'N';
  output[1] = ' '.repeat(nLabelPadding) + '|';
  
  // Render rows with proper centering
  for (const row of finalRows) {
    const rowWidth = row.tiles.length;
    const padding = Math.floor((maxRowWidth - rowWidth) / 2);
    
    let line = '';
    
    // Add west indicator for center row
    if (row.relY === 0) {
      line += 'W---';
    } else {
      line += '    ';
    }
    
    // Add left padding to center the row
    line += ' '.repeat(padding * 2); // 2 spaces per tile (space + char)
    
    // Render tiles with consistent spacing
    for (let i = 0; i < row.tiles.length; i++) {
      const tile = row.tiles[i];
      line += ' ' + tile.char;
    }
    
    // Add right padding to center the row
    const rightPadding = maxRowWidth - rowWidth - padding;
    line += ' '.repeat(rightPadding * 2);
    
    // Add east indicator for center row
    if (row.relY === 0) {
      line += '---E';
    }
    
    output.push(line);
  }
  
  // Add compass at the bottom (centered)
  output.push(' '.repeat(nLabelPadding) + '|');
  output.push(' '.repeat(nLabelPadding) + 'S');
  
  return output.join('\n');
}