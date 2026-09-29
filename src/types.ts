export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  modelUsed?: string;
  durationMs?: number;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
  systemPrompt?: string;
}

export interface GroqModelInfo {
  id: string;
  name: string;
  description: string;
  provider: string;
  speed: string;
  badge: string;
  contextWindow: number;
}

export interface ChatSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}
