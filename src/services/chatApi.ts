/**
 * Simple chat API service for character conversations
 */

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000';

export interface ChatResponse {
  message: string;
}

export interface ChatError {
  detail: string;
}

/**
 * Send a chat message with system prompt
 */
export async function sendChatMessage(
  message: string,
  systemPrompt: string
): Promise<string> {
  console.log('Sending chat message:', message);
  console.log('System prompt:', systemPrompt);
  const response = await fetch(`${CHAT_API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      system_prompt: systemPrompt,
    }),
  });

  if (!response.ok) {
    const error: ChatError = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  const data: ChatResponse = await response.json();
  console.log('Response:', data.message);
  return data.message;
}

