import type { CommandHandler } from '../commandHandler';

export const handleHelp: CommandHandler = () => {
  const helpText = `
Available Commands:

Movement:
  n, north     - Move north
  s, south     - Move south
  e, east      - Move east
  w, west      - Move west

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

