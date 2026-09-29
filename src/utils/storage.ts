import { ChatSession, ChatSettings } from '../types';

const CHATS_STORAGE_KEY = 'groqchat_sessions_v1';
const SETTINGS_STORAGE_KEY = 'groqchat_settings_v1';

export const DEFAULT_SETTINGS: ChatSettings = {
  model: 'openai/gpt-oss-120b',
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: 'You are GroqChat, an advanced, lightning-fast AI assistant powered by Groq LPU inference. You provide insightful, accurate, well-formatted, and helpful responses. Format code snippets cleanly with language labels.',
};

export const INITIAL_CHAT: ChatSession = {
  id: 'welcome-chat',
  title: 'Welcome to GroqChat',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  model: 'openai/gpt-oss-120b',
  messages: [
    {
      id: 'msg-welcome-1',
      role: 'assistant',
      content: `### Welcome to GroqChat! ⚡\n\nI am powered by **Groq's Ultra-Fast LPU™ Inference Engine**, delivering near-instant responses with top models including **GPT OSS 120B**, **GPT OSS 20B**, **Qwen 3.8 27B**, and more.\n\nHere are a few things you can do:\n- 🚀 **Ask any question** or brainstorm ideas with real-time streaming.\n- 💻 **Write, debug, and review code** in Python, TypeScript, Rust, Go, SQL, and more.\n- ⚙️ **Switch models & tune temperature** from the top bar or sidebar.\n- 📂 **Save & organize conversation history** directly in your browser.`,
      createdAt: Date.now(),
      modelUsed: 'openai/gpt-oss-120b',
    },
  ],
};

export function loadSavedChats(): ChatSession[] {
  try {
    const raw = localStorage.getItem(CHATS_STORAGE_KEY);
    if (!raw) return [INITIAL_CHAT];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [INITIAL_CHAT];
  } catch (e) {
    console.error('Failed to load chats from localStorage:', e);
    return [INITIAL_CHAT];
  }
}

export function saveChats(chats: ChatSession[]): void {
  try {
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
  } catch (e) {
    console.error('Failed to save chats to localStorage:', e);
  }
}

export function loadSavedSettings(): ChatSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: ChatSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}
