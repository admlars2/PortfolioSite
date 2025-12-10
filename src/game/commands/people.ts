import type { CommandHandler } from '../commandHandler';
import { getNearbyPeople } from '../map';

export const handlePeople: CommandHandler = (_args, state) => {
  const people = getNearbyPeople(
    state.currentLocation,
    state.isInside,
    state.companions,
    state.playerPosition,
    state.mapSeed
  );
  
  if (people.length === 0) {
    const locationContext = state.isInside 
      ? `in ${state.currentLocation || 'here'}`
      : 'nearby';
    
    return {
      success: true,
      message: `There is no one ${locationContext} right now.`,
    };
  }
  
  let message = state.isInside 
    ? `People in ${state.currentLocation || 'here'}:\n`
    : 'People nearby:\n';
  
  message += '\n';
  
  people.forEach((person, index) => {
    const isCompanion = state.companions.some(id => id.toLowerCase() === person.id.toLowerCase());
    const companionTag = isCompanion ? ' (your companion)' : '';
    message += `${index + 1}. ${person.name}${companionTag}`;
    if (person.description) {
      message += ` - ${person.description}`;
    }
    message += '\n';
  });
  
  return {
    success: true,
    message: message.trim(),
  };
};

