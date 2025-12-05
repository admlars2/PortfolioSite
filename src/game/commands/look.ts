import type { CommandHandler } from '../commandHandler';
import { getTileAt, getPeopleInLocation } from '../map';

export const handleLook: CommandHandler = (_args, state) => {
  const { x, y } = state.playerPosition;
  
  if (state.isInside) {
    // Inside a building - show room info
    const locationName = state.currentLocation || 'here';
    const people = getPeopleInLocation(locationName, true);
    
    let message = `You are inside ${locationName}.\n`;
    message += '═'.repeat(50) + '\n\n';
    
    // Get tile info if available (for the tile we entered from)
    // For now, just show location-based info
    
    if (people.length > 0) {
      message += 'People here:\n';
      people.forEach(person => {
        message += `  • ${person.name}`;
        if (person.description) {
          message += ` - ${person.description}`;
        }
        message += '\n';
      });
      message += '\n';
    }
    
    message += 'Available actions:\n';
    message += '  • exit - Leave this location\n';
    message += '  • people - See who is here\n';
    
    return {
      success: true,
      message: message.trim(),
    };
  }
  
  // Outside - show tile info
  const tile = getTileAt(x, y);
  
  if (!tile) {
    // Default tile description if not registered
    return {
      success: true,
      message: `You are at coordinates (${x}, ${y}). The area around you is unremarkable.`,
    };
  }
  
  let message = tile.description + '\n';
  message += '═'.repeat(50) + '\n\n';
  
  // Show building info if available
  if (tile.buildingName) {
    message += `Building: ${tile.buildingName}\n`;
    if (tile.buildingDescription) {
      message += `${tile.buildingDescription}\n`;
    }
    message += '\n';
  }
  
  // Show available actions
  if (tile.actions.length > 0) {
    message += 'Available actions:\n';
    tile.actions.forEach(action => {
      message += `  • ${action.command} - ${action.description}\n`;
    });
  }
  
  return {
    success: true,
    message: message.trim(),
  };
};