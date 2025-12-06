import type { CommandHandler } from '../commandHandler';
import { initializeMap, renderMap, initializeMapNoise } from '../map';

export const handleMap: CommandHandler = (args, state) => {
  // Handle subcommands
  if (args.length > 0 && args[0].toLowerCase() === 'seed') {
    // Handle "map seed" or "map seed <value>"
    if (args.length === 1) {
      // Just "map seed" - show current seed (available to everyone)
      const mapSeed = state.mapSeed || 'not-initialized';
      return {
        success: true,
        message: `Map seed: ${mapSeed}`,
      };
    } else {
      // "map seed <value>" - set new seed (debug-only)
      // Only allow if player name is "debug"
      if (state.playerName?.toLowerCase() !== 'debug') {
        return {
          success: false,
          message: 'Unknown command. Type "help" for a list of commands.',
        };
      }
      
      const newSeed = args.slice(1).join(' ').trim();
      
      if (!newSeed || newSeed.length === 0) {
        return {
          success: false,
          message: 'Please provide a valid seed.',
        };
      }
      
      const mapConfig = initializeMap(newSeed);
      
      // Initialize noise with the new seed
      initializeMapNoise(mapConfig.seed);
      
      return {
        success: true,
        message: `Map seed set to: ${mapConfig.seed}`,
        stateUpdate: {
          mapSeed: mapConfig.seed,
        },
      };
    }
  }
  
  // Parse zoom level if provided (e.g., "map 2" or "map 3")
  let zoomLevel = 1;
  if (args.length > 0) {
    const zoomArg = parseInt(args[0], 10);
    if (!isNaN(zoomArg) && zoomArg >= 1 && zoomArg <= 3) {
      zoomLevel = zoomArg;
    } else if (args[0].toLowerCase() !== 'seed') {
      // Invalid argument that's not "seed"
      return {
        success: false,
        message: 'Invalid zoom level. Use "map" (or "map 1"), "map 2", or "map 3".',
      };
    }
  }
  
  // Default map command - show map display
  const { x, y } = state.playerPosition;
  // Get tile keys from saved tiles
  const loadedTiles = Object.keys(state.savedTiles || {});
  const mapDisplay = renderMap(x, y, loadedTiles, zoomLevel);
  
  let message = 'Map';
  if (zoomLevel === 2) {
    message += ' - Zoom level 2';
  } else if (zoomLevel === 3) {
    message += ' - Zoom level 3';
  }
  message += ':\n';
  message += '═'.repeat(30) + '\n';
  message += mapDisplay;
  message += '\n' + '═'.repeat(30) + '\n';
  message += '\nLegend:\n';
  message += '  @ - Your position\n';
  message += '  H - Home (grandma\'s house)\n';
  message += '  F - Forest\n';
  message += '  B - Building\n';
  message += '  . - Plains (visited)\n';
  message += '    - Unvisited tile\n';
  
  return {
    success: true,
    message: message.trim(),
  };
};