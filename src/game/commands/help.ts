import type { CommandHandler } from '../commandHandler';

export const handleHelp: CommandHandler = () => {
  const helpText = `
Available Commands:

Movement:
  n, north     - Move north
  s, south     - Move south
  e, east      - Move east
  w, west      - Move west

Location:
  enter          - Enter the building on your current tile
  exit, leave    - Exit the current location
  location, loc  - Examine your current location and available actions

People:
  people, p    - List people nearby or in your current location
  talk, t [person] [message] - Talk to a person nearby

Player:
  stats, status - View your stats
  inventory, inv, i - View your inventory

System:
  help, h, ?   - Show this help message
  audio        - Configure audio settings
  map          - Display the map

Type a command and press Enter to execute.
`.trim();

  return {
    success: true,
    message: helpText,
  };
};

