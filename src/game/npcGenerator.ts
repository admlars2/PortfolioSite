import seedrandom from 'seedrandom';
import type { BiomeType, TileData } from './map';
import { Character, type PersonalityTraits, getCharacter, registerCharacter } from './person';
import { getAllItems } from './item';

type NPCArchetype = 'companion' | 'shopkeeper' | 'traveler';

const FIRST_NAMES = ['Arin', 'Lena', 'Milo', 'Sage', 'Rhea', 'Thorne', 'Kato', 'Mara', 'Pip', 'Niko', 'Tamsin', 'Kei', 'Ira'];
const COMPANION_TITLES = ['the Scout', 'the Guide', 'the Ranger', 'the Tinkerer', 'the Protector'];
const SHOPKEEPER_TITLES = ['the Merchant', 'the Trader', 'the Herbalist', 'the Shopkeep', 'the Provisioner'];
const TRAVELER_TITLES = ['the Bard', 'the Scholar', 'the Wanderer', 'the Storyteller'];

// Lower spawn chances so encounters feel sparse and special
const SPAWN_CHANCE_BY_BIOME: Record<BiomeType | 'default', number> = {
  forest: 0.18,
  mountain: 0.08,
  plains: 0.10,
  default: 0.1,
};

function createRng(seed: string) {
  return seedrandom(seed);
}

function pick<T>(items: T[], rng: seedrandom.PRNG): T {
  return items[Math.floor(rng() * items.length)];
}

function pickWeighted<T extends { weight: number }>(items: Array<T & { value: NPCArchetype }>, rng: seedrandom.PRNG): NPCArchetype {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * totalWeight;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) {
      return item.value;
    }
  }
  return items[items.length - 1].value;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function buildPersonality(rng: seedrandom.PRNG): PersonalityTraits {
  // Generate personalities with slight bias toward the middle to avoid extremes
  const base = () => clamp01(0.25 + rng() * 0.7);
  return {
    openness: base(),
    conscientiousness: base(),
    extraversion: base(),
    agreeableness: base(),
    neuroticism: clamp01(0.15 + rng() * 0.7),
  };
}

function sanitizeTileKey(tile: TileData): string {
  return `${tile.x}_${tile.y}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function buildInventory(archetype: NPCArchetype, biome: BiomeType | undefined, rng: seedrandom.PRNG): Record<string, number> {
  const allItems = getAllItems();
  const biomeFiltered = biome
    ? allItems.filter(item => item.id.includes(biome) || item.description.toLowerCase().includes(biome))
    : [];

  const pool = biomeFiltered.length > 0 ? biomeFiltered : allItems;
  const inventory: Record<string, number> = {};

  const itemCount = archetype === 'shopkeeper'
    ? 2 + Math.floor(rng() * 2) // 2-3 items
    : rng() > 0.6
      ? 1
      : 0;

  for (let i = 0; i < itemCount; i++) {
    const item = pick(pool, rng);
    // Shopkeepers carry more stock, companions carry small stacks
    const quantity = archetype === 'shopkeeper' ? 1 + Math.floor(rng() * 3) : 1;
    inventory[item.id] = (inventory[item.id] || 0) + quantity;
  }

  return inventory;
}

function buildName(archetype: NPCArchetype, rng: seedrandom.PRNG): string {
  const first = pick(FIRST_NAMES, rng);
  if (archetype === 'companion') {
    return `${first} ${pick(COMPANION_TITLES, rng)}`;
  }
  if (archetype === 'shopkeeper') {
    return `${first} ${pick(SHOPKEEPER_TITLES, rng)}`;
  }
  return `${first} ${pick(TRAVELER_TITLES, rng)}`;
}

function buildArchetypeWeights(biome: BiomeType | undefined): Array<{ value: NPCArchetype; weight: number }> {
  // Tilt probabilities a bit depending on biome
  return [
    { value: 'shopkeeper', weight: biome === 'forest' ? 0.45 : 0.35 },
    { value: 'companion', weight: biome === 'mountain' ? 0.45 : 0.35 },
    { value: 'traveler', weight: 0.25 },
  ];
}

function buildBiography(archetype: NPCArchetype, biome: BiomeType | undefined): { description: string; biography: string; job: string } {
  if (archetype === 'shopkeeper') {
    return {
      description: 'A friendly merchant who sets up small roadside stalls with curated goods.',
      biography: 'Travels light between villages, trading herbs, teas, and tools to anyone passing by. Enjoys chatting about local rumors.',
      job: biome === 'forest' ? 'herbalist merchant' : 'traveling shopkeeper',
    };
  }
  if (archetype === 'companion') {
    return {
      description: 'A capable wanderer who looks eager to join a good adventure.',
      biography: 'Lives on the road, lending a hand to travelers in need and picking up new skills from every biome visited.',
      job: biome === 'mountain' ? 'climbing guide' : 'pathfinder',
    };
  }
  return {
    description: 'A well-traveled storyteller with plenty of gossip and directions to share.',
    biography: 'Keeps notes on hidden paths, quiet groves, and useful folks met along the way. Happy to share tales over a cup of tea.',
    job: 'wandering storyteller',
  };
}

function createCharacterForTile(tile: TileData, rng: seedrandom.PRNG, index: number): Character {
  const archetype = pickWeighted(buildArchetypeWeights(tile.biome), rng);
  const name = buildName(archetype, rng);
  const tileKey = sanitizeTileKey(tile);
  const id = `npc_${archetype}_${tileKey}_${index}`;
  const personality = buildPersonality(rng);
  const { description, biography, job } = buildBiography(archetype, tile.biome);
  const inventory = buildInventory(archetype, tile.biome, rng);

  let skills: Record<string, number>;
  if (archetype === 'shopkeeper') {
    skills = { trading: 8, persuasion: 6, herbalism: tile.biome === 'forest' ? 7 : 5 };
  } else if (archetype === 'companion') {
    skills = { survival: 7, navigation: 7, herbalism: 5, crafting: 5 };
  } else {
    skills = { lore: 8, cartography: 6 };
  }

  return new Character(
    id,
    name,
    description,
    personality,
    {
      canBeCompanion: archetype === 'companion',
      biography,
      job,
      skills,
      relationshipContext: {},
      questIds: [],
      inventory,
    }
  );
}

/**
 * Generate deterministic NPCs for a tile using the map seed and tile coordinates.
 */
export function generateNPCsForTile(tile: TileData, mapSeed?: string): Character[] {
  const baseSeed = mapSeed || 'default-map-seed';
  const seed = `${baseSeed}|${tile.x},${tile.y}|npc`;
  const rng = createRng(seed);

  const biomeKey: BiomeType | 'default' = tile.biome ?? 'default';
  const spawnChance = SPAWN_CHANCE_BY_BIOME[biomeKey] ?? SPAWN_CHANCE_BY_BIOME.default;
  if (rng() > spawnChance) {
    return [];
  }

  const npcCount = rng() > 0.9 ? 2 : 1; // Rarely spawn pairs
  const characters: Character[] = [];

  for (let i = 0; i < npcCount; i++) {
    const character = createCharacterForTile(tile, rng, i);
    characters.push(character);
  }

  return characters;
}

/**
 * Ensure NPCs are generated and registered for a tile. Persists NPC ids on the tile to
 * keep encounters consistent after saving/loading.
 */
export function ensureTileNPCs(tile: TileData, mapSeed?: string): Character[] {
  // If we've already generated IDs for this tile, reuse them
  if (tile.npcIds) {
    const npcs: Character[] = [];
    for (const id of tile.npcIds) {
      let character = getCharacter(id);
      if (!character) {
        // Regenerate deterministically and re-register if missing
        const regenerated = generateNPCsForTile(tile, mapSeed).find(c => c.id === id);
        if (regenerated) {
          registerCharacter(regenerated);
          character = regenerated;
        }
      }
      if (character) {
        npcs.push(character);
      }
    }
    return npcs;
  }

  const generated = generateNPCsForTile(tile, mapSeed);
  const npcIds = generated.map(c => c.id);
  tile.npcIds = npcIds;

  generated.forEach(registerCharacter);
  return generated;
}

