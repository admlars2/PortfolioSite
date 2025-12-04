import { createNoise2D } from 'simplex-noise';
import seedrandom from 'seedrandom';

// Map configuration
export interface MapConfig {
  seed: string;
  width: number;
  height: number;
}

// Initialize map with random seed
export function initializeMap(seed?: string): MapConfig {
  const mapSeed = seed || generateRandomSeed();
  
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

// Map will be implemented here later
// This will include terrain generation, tile types, etc.

