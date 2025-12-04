export interface GameState {
  playerPosition: {
    x: number;
    y: number;
  };
  audioEnabled: boolean;
  audioVolume: number;
  mapSeed?: string;
}

export const initialGameState: GameState = {
  playerPosition: {
    x: 0,
    y: 0,
  },
  audioEnabled: true,
  audioVolume: 0.5,
};

export function createGameState(): GameState {
  // Load from localStorage if available
  const saved = localStorage.getItem('herb-search-game-state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return { ...initialGameState, ...parsed };
    } catch {
      return initialGameState;
    }
  }
  return initialGameState;
}

export function saveGameState(state: GameState): void {
  localStorage.setItem('herb-search-game-state', JSON.stringify(state));
}

