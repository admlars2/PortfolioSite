import { useRef, useEffect } from 'react';
import soundPackConfig from '@/assets/sounds/keyboards/nk-cream/config.json';

interface SoundPackConfig {
  defines: Record<string, string | null>;
}

// Map KeyboardEvent.code values to config IDs
const keyCodeToConfigId: Record<string, number> = {
  // Number keys (top row) - mapped to Q-P sounds since they're in similar positions
  'Digit1': 1,   // 1 -> Q
  'Digit2': 2,   // 2 -> W
  'Digit3': 3,   // 3 -> E
  'Digit4': 5,   // 4 -> R
  'Digit5': 6,   // 5 -> T
  'Digit6': 7,   // 6 -> Y
  'Digit7': 8,   // 7 -> U
  'Digit8': 9,   // 8 -> I
  'Digit9': 10,  // 9 -> O
  'Digit0': 11,  // 0 -> P
  
  // Top row: Q-P
  'KeyQ': 1,   // Q
  'KeyW': 2,   // W
  'KeyE': 3,   // E
  'KeyR': 5,   // R
  'KeyT': 6,   // T
  'KeyY': 7,   // Y
  'KeyU': 8,   // U
  'KeyI': 9,   // I
  'KeyO': 10,  // O
  'KeyP': 11,  // P
  
  // Second row: A-L
  'KeyA': 30,  // A
  'KeyS': 31,  // S
  'KeyD': 32,  // D
  'KeyF': 33,  // F
  'KeyG': 34,  // G
  'KeyH': 35,  // H
  'KeyJ': 36,  // J
  'KeyK': 37,  // K
  'KeyL': 38,  // L
  
  // Third row: Z-M
  'KeyZ': 44,  // Z
  'KeyX': 45,  // X
  'KeyC': 46,  // C
  'KeyV': 47,  // V
  'KeyB': 48,  // B
  'KeyN': 49,  // N
  'KeyM': 50,  // M
  
  // Special keys
  'Backspace': 14,   // Backspace
  'Tab': 15,   // Tab
  'Enter': 28,  // Enter
  'ShiftLeft': 42,  // Left Shift
  'ShiftRight': 42,  // Right Shift
  'Space': 57,  // Space
  'CapsLock': 58,  // Caps Lock
  
  // Brackets
  'BracketLeft': 12, // [
  'BracketRight': 13, // ]
};

export function useKeyboardSounds(enabled: boolean = true, volume: number = 0.5) {
  const audioCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const configRef = useRef<SoundPackConfig>(soundPackConfig as SoundPackConfig);
  const volumeRef = useRef(volume);

  // Update volume ref when it changes
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const playSound = (code: string) => {
    if (!enabled) return;

    const configId = keyCodeToConfigId[code];
    if (!configId) return;

    const soundFile = configRef.current.defines[configId.toString()];
    if (!soundFile || soundFile === 'null') return;

    try {
      // Check cache first
      let audio = audioCacheRef.current.get(soundFile);
      
      if (!audio) {
        // Create new audio element using Vite's asset handling
        // Construct URL relative to the hook file location
        const audioUrl = new URL(
          `../assets/sounds/keyboards/nk-cream/${soundFile}`,
          import.meta.url
        ).href;
        audio = new Audio(audioUrl);
        audio.volume = volumeRef.current;
        audioCacheRef.current.set(soundFile, audio);
      }

      // Clone and play to allow overlapping sounds
      const audioClone = audio.cloneNode() as HTMLAudioElement;
      audioClone.volume = volumeRef.current;
      audioClone.play().catch(err => {
        // Silently fail if audio can't play (e.g., user hasn't interacted yet)
        console.debug('Audio play failed:', err);
      });
    } catch (error) {
      console.debug('Error playing sound:', error);
    }
  };

  return { playSound };
}

