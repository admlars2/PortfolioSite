import type { CommandHandler } from '../commandHandler';
import type { GameState } from '../gameState';

export const handleStats: CommandHandler = (_args, state: GameState) => {
  const stats = state.playerStats;
  
  // Format stats with visual bars
  const formatBar = (current: number, max: number, length: number = 20): string => {
    const filled = Math.round((current / max) * length);
    const empty = length - filled;
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
  };

  const formatStat = (label: string, current: number, max: number): string => {
    const percentage = Math.round((current / max) * 100);
    const bar = formatBar(current, max);
    return `${label.padEnd(12)} ${bar} ${current}/${max} (${percentage}%)`;
  };

  let message = 'Player Stats:\n';
  message += '═'.repeat(50) + '\n\n';
  
  // Display player name if available
  if (state.playerName) {
    message += `Name: ${state.playerName}\n\n`;
  }
  
  message += formatStat('Health', stats.health, stats.maxHealth) + '\n';
  message += formatStat('Hunger', stats.hunger, stats.maxHunger) + '\n';
  message += formatStat('Saturation', stats.saturation, stats.maxSaturation) + '\n';
  message += formatStat('Exhaustion', stats.exhaustion, stats.maxExhaustion) + '\n';
  
  return {
    success: true,
    message: message.trim(),
  };
};

