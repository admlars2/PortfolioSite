import type { CommandHandler } from '../commandHandler';
import type { GameState } from '../gameState';

export const handleAudio: CommandHandler = (args, state: GameState) => {
  if (args.length === 0) {
    // Show current audio settings
    return {
      success: true,
      message: `Audio Settings:
  Enabled: ${state.audioEnabled ? 'Yes' : 'No'}
  Volume: ${Math.round(state.audioVolume * 100)}%

Usage:
  audio on/off        - Enable/disable audio
  audio volume <0-100> - Set volume (0-100)
  audio               - Show current settings`,
    };
  }
  
  const subcommand = args[0].toLowerCase();
  
  if (subcommand === 'on' || subcommand === 'enable') {
    return {
      success: true,
      message: 'Audio enabled.',
      stateUpdate: {
        audioEnabled: true,
      },
    };
  }
  
  if (subcommand === 'off' || subcommand === 'disable') {
    return {
      success: true,
      message: 'Audio disabled.',
      stateUpdate: {
        audioEnabled: false,
      },
    };
  }
  
  if (subcommand === 'volume' && args.length > 1) {
    const volume = parseFloat(args[1]);
    if (isNaN(volume) || volume < 0 || volume > 100) {
      return {
        success: false,
        message: 'Volume must be a number between 0 and 100.',
      };
    }
    
    return {
      success: true,
      message: `Volume set to ${Math.round(volume)}%.`,
      stateUpdate: {
        audioVolume: volume / 100,
      },
    };
  }
  
  return {
    success: false,
    message: `Unknown audio command: "${subcommand}". Use "audio" to see available options.`,
  };
};