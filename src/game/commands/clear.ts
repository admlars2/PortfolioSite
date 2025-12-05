import type { CommandHandler } from '../commandHandler';
// Track clear confirmation state
let clearConfirmations = 0;
const REQUIRED_CONFIRMATIONS = 3;

export const handleClear: CommandHandler = (_args, _state) => {
  clearConfirmations++;
  
  if (clearConfirmations === 1) {
    return {
      success: true,
      message: '⚠️  WARNING: This will delete all saved game data!\n\n' +
               'Type "clear" again to confirm (2/3)...',
    };
  }
  
  if (clearConfirmations === 2) {
    return {
      success: true,
      message: '⚠️  WARNING: This will PERMANENTLY delete all your progress!\n\n' +
               'Type "clear" one more time to confirm (3/3)...',
    };
  }
  
  if (clearConfirmations >= REQUIRED_CONFIRMATIONS) {
    // Reset confirmation counter
    clearConfirmations = 0;
    
    // Clear localStorage
    localStorage.removeItem('herb-search-game-state');
    
    return {
      success: true,
      message: '✅ Save data cleared! The game will reset on next load.\n\n' +
               'You can refresh the page to start fresh.',
      // Note: We can't actually reset the state here, but localStorage is cleared
      // The user will need to refresh to see the effect
    };
  }
  
  return {
    success: false,
    message: 'Unexpected error in clear confirmation.',
  };
};

// Reset confirmation counter if any other command is executed
export function resetClearConfirmations(): void {
  clearConfirmations = 0;
}

