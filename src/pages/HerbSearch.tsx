import { useState, useRef, useEffect } from 'react';
import { useKeyboardSounds } from '@/hooks/useKeyboardSounds';
import { createGameState, saveGameState, type GameState } from '@/game/gameState';
import { executeCommand } from '@/game/commandHandler';
import { initializeMap, initializeMapNoise, loadTilesFromState } from '@/game/map';
import { initializeQuests } from '@/game/quests';

interface OutputLine {
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: number;
}

export default function HerbSearch() {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [gameState, setGameState] = useState<GameState>(() => {
    // Initialize quests first
    initializeQuests();
    
    const state = createGameState();
    // Initialize map seed if not present
    if (!state.mapSeed) {
      const mapConfig = initializeMap();
      return { ...state, mapSeed: mapConfig.seed };
    } else {
      // Initialize noise with existing map seed
      initializeMapNoise(state.mapSeed);
      // Load saved tiles into registry
      if (state.savedTiles && Object.keys(state.savedTiles).length > 0) {
        loadTilesFromState(state.savedTiles);
      }
    }
    return state;
  });
  const [outputHistory, setOutputHistory] = useState<OutputLine[]>([]);
  const [isWaitingForName, setIsWaitingForName] = useState(!gameState.playerName);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTalkPerson, setCurrentTalkPerson] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const { playSound } = useKeyboardSounds(gameState.audioEnabled, gameState.audioVolume);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Show opening sequence if no player name
  useEffect(() => {
    if (isWaitingForName && outputHistory.length === 0) {
      setOutputHistory([{
        type: 'output',
        content: 'Welcome to Herb Search!\n\nWhat is your name?',
        timestamp: Date.now(),
      }]);
    }
    // Note: Opening story after name is set is handled in handleSubmit
  }, [isWaitingForName, outputHistory.length]);

  // Save game state when it changes
  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  // Scroll output to bottom when new output is added
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputHistory]);

  // Refocus input when loading completes
  useEffect(() => {
    if (!isLoading && !isWaitingForName && inputRef.current) {
      // Small delay to ensure input is enabled
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isLoading, isWaitingForName]);

  // Update cursor position
  useEffect(() => {
    if (inputRef.current && measureRef.current && cursorRef.current && isFocused) {
      const input = inputRef.current;
      const position = input.selectionStart || 0;
      
      // Measure text width up to cursor position
      const textBeforeCursor = input.value.substring(0, position);
      measureRef.current.textContent = textBeforeCursor;
      const textWidth = measureRef.current.offsetWidth;
      
      // Get scroll position to account for horizontal scrolling
      const scrollLeft = input.scrollLeft || 0;
      const paddingLeft = 9 * 16; // pl-36 = 9rem = 144px
      const inputWidth = input.offsetWidth;
      
      // Calculate cursor position relative to visible area
      // Account for scroll offset so cursor moves with text
      let cursorPosition = paddingLeft + textWidth - scrollLeft;
      
      // Clamp cursor to visible area (keep it within input bounds)
      const minPosition = paddingLeft;
      const maxPosition = paddingLeft + inputWidth - paddingLeft - 6; // Account for padding-right
      cursorPosition = Math.max(minPosition, Math.min(maxPosition, cursorPosition));
      
      cursorRef.current.style.left = `${cursorPosition}px`;
    }
  }, [input, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSelectionChange = () => {
    // Trigger cursor position update
    if (inputRef.current && measureRef.current && cursorRef.current && isFocused) {
      const input = inputRef.current;
      const position = input.selectionStart || 0;
      const textBeforeCursor = input.value.substring(0, position);
      measureRef.current.textContent = textBeforeCursor;
      const textWidth = measureRef.current.offsetWidth;
      
      // Get scroll position to account for horizontal scrolling
      const scrollLeft = input.scrollLeft || 0;
      const paddingLeft = 9 * 16; // pl-36 = 9rem = 144px
      const inputWidth = input.offsetWidth;
      
      // Calculate cursor position relative to visible area
      let cursorPosition = paddingLeft + textWidth - scrollLeft;
      
      // Clamp cursor to visible area
      const minPosition = paddingLeft;
      const maxPosition = paddingLeft + inputWidth - paddingLeft - 6;
      cursorPosition = Math.max(minPosition, Math.min(maxPosition, cursorPosition));
      
      cursorRef.current.style.left = `${cursorPosition}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Play sound for the key pressed
    if (gameState.audioEnabled) {
      playSound(e.code);
    }
    
    // Update cursor position
    handleSelectionChange();
  };

  const addOutput = (type: OutputLine['type'], content: string) => {
    setOutputHistory(prev => [...prev, {
      type,
      content,
      timestamp: Date.now(),
    }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const commandInput = input.trim();
    
    if (!commandInput) {
      return;
    }

    // Handle name input if waiting for name
    if (isWaitingForName) {
      const playerName = commandInput;
      if (playerName.length < 1) {
        addOutput('error', 'Please enter a valid name.');
        setInput('');
        return;
      }
      
      // Add command to output
      addOutput('command', `> ${commandInput}`);
      
      // Set player name
      setGameState(prev => {
        const newState = { ...prev, playerName };
        saveGameState(newState);
        return newState;
      });
      
      setIsWaitingForName(false);
      
      // Show opening story
      const openingMessage = `\nNice to meet you, ${playerName}!\n\n` +
        `You are inside grandma's house.\n\n` +
        `Grandma has called you downstairs. The warm aroma of herbs fills the air.\n\n` +
        `Type "help" to see all available commands.\n` +
        `Try typing "talk grandma", then asking about tasks!`;
      addOutput('output', openingMessage);
      
      // Clear input
      setInput('');
      
      // Refocus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return;
    }

    // Parse command to check if it's a talk command
    const commandParts = commandInput.trim().toLowerCase().split(/\s+/);
    const isTalkCommand = commandParts[0] === 'talk' || commandParts[0] === 't';
    const talkPerson = isTalkCommand && commandParts.length > 1 ? commandParts[1] : null;
    const talkMessage = isTalkCommand ? commandParts.slice(2).join(' ') : null;

    // Add command to output - show "You: [message]" for talk commands with message
    if (isTalkCommand && talkMessage) {
      addOutput('command', `You: ${talkMessage}`);
    } else {
      addOutput('command', `> ${commandInput}`);
    }

    // Set loading state for async commands (like talk)
    if (isTalkCommand && talkPerson) {
      setIsLoading(true);
      setCurrentTalkPerson(talkPerson);
    }

    // Execute command
    try {
      const result = await executeCommand(commandInput, gameState);
      
      // Clear loading state
      setIsLoading(false);
      setCurrentTalkPerson(null);
      
      // Add result to output
      addOutput(result.success ? 'output' : 'error', result.message);

      // Update game state if there's a state update
      if (result.updateState) {
        // Full state update (for async handlers like talk)
        setGameState(result.updateState);
      } else if (result.stateUpdate) {
        // Partial state update
        setGameState(prev => {
          const newState = { ...prev, ...result.stateUpdate };
          // If clear command succeeded, also reset the component state
          if (commandInput.toLowerCase() === 'clear' || commandInput.toLowerCase() === 'clearsave') {
            if (result.message.includes('Save data cleared')) {
              // Reset to initial state after a short delay to show the message
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            }
          }
          return newState;
        });
      }
    } catch (error) {
      setIsLoading(false);
      setCurrentTalkPerson(null);
      
      // Suppress browser extension message channel errors (harmless)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('message channel closed') || errorMessage.includes('asynchronous response')) {
        // This is a browser extension error, ignore it
        return;
      }
      
      addOutput('error', `Error executing command: ${errorMessage}`);
    }

    // Clear input
    setInput('');
    
    // Refocus will be handled by useEffect when loading completes
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-app">
      <div className="w-full max-w-2xl">
        {/* Terminal-style header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-sm text-secondary font-mono ml-2">herb-search v1.0</span>
          </div>
          <div className="h-px border-t border-default"></div>
        </div>

        {/* Main content area */}
        <div className="space-y-4">

          {/* Command input */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative group">
              {/* Prompt indicator */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                <span className="text-accent font-mono font-semibold">$</span>
                <span className="text-secondary font-mono text-sm">herb-search</span>
                <span className="text-secondary">›</span>
              </div>

              {/* Hidden span for measuring text width */}
              <span
                ref={measureRef}
                className="absolute invisible font-mono text-lg text-primary"
                style={{ whiteSpace: 'pre' }}
                aria-hidden="true"
              />

              {/* Input field */}
              <input
                ref={inputRef}
                id="herb-search-input"
                name="command"
                type="text"
                value={input}
                onChange={handleInputChange}
                onSelect={handleSelectionChange}
                onKeyUp={handleSelectionChange}
                onKeyDown={handleKeyDown}
                onClick={handleSelectionChange}
                onScroll={handleSelectionChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={isLoading}
                className="w-full pl-36 pr-6 py-4 bg-card border-2 border-default rounded-lg 
                         text-primary font-mono text-lg
                         focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
                         transition-all duration-200
                         placeholder:text-secondary/50
                         shadow-sm hover:shadow-md focus:shadow-lg
                         caret-transparent
                         placeholder:ml-[2px]
                         disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={isLoading ? "Waiting for response..." : (isWaitingForName ? "Enter your name..." : "Enter command...")}
                autoComplete="off"
                spellCheck="false"
              />

              {/* Custom cursor */}
              {isFocused && (
                <div
                  ref={cursorRef}
                  className="absolute top-1/2 -translate-y-1/2 
                            w-1 h-6 bg-accent pointer-events-none"
                  style={{ left: `${9 * 16}px` }}
                />
              )}
            </div>

            {/* Hint text */}
            <p className="mt-3 text-sm text-secondary text-center">
              Press <kbd className="px-2 py-1 bg-surface-muted border border-default rounded text-xs font-mono">Enter</kbd> to execute
            </p>
          </form>

          {/* Output area */}
          <div 
            ref={outputRef}
            className="mt-8 min-h-[200px] max-h-[600px] bg-card border border-default rounded-lg p-6 
                        font-mono text-xs text-secondary overflow-y-auto"
            style={{ fontFamily: 'monospace' }}
          >
            {outputHistory.length === 0 ? (
              <div className="text-center text-secondary/60">
                Command output will appear here...
                <br />
                <span className="text-xs mt-2 block">Type "help" for available commands</span>
              </div>
            ) : (
              <div className="space-y-2">
                {outputHistory.map((line, index) => (
                  <div
                    key={index}
                    className={`whitespace-pre-wrap break-words ${
                      line.type === 'command'
                        ? 'text-accent'
                        : line.type === 'error'
                        ? 'text-red-500'
                        : 'text-secondary'
                    }`}
                  >
                    {line.content}
                  </div>
                ))}
                {/* Loading indicator */}
                {isLoading && currentTalkPerson && (
                  <div className="text-secondary">
                    <span className="wave-text">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

