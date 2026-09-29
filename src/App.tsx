import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Zap,
  Send,
  Square,
  Sparkles,
  ChevronDown,
  Download,
  Share2,
  Trash2,
  AlertCircle,
  Code2,
  BookOpen,
  Compass,
  Lightbulb,
} from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { Sidebar } from './components/Sidebar';
import { ModelSelectorModal } from './components/ModelSelectorModal';
import { SettingsModal } from './components/SettingsModal';
import { ApiKeyGuideModal } from './components/ApiKeyGuideModal';
import { ChatSession, Message, GroqModelInfo, ChatSettings } from './types';
import {
  loadSavedChats,
  saveChats,
  loadSavedSettings,
  saveSettings,
  INITIAL_CHAT,
} from './utils/storage';

const DEFAULT_MODELS: GroqModelInfo[] = [
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B',
    description: 'Top tier open-weights intelligence with reasoning & 131k context window',
    provider: 'OpenAI',
    speed: '~280 tokens/sec',
    badge: 'Flagship',
    contextWindow: 131072,
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B',
    description: 'Compact, highly responsive reasoning model with 131k context window',
    provider: 'OpenAI',
    speed: '~650 tokens/sec',
    badge: 'Ultra Fast',
    contextWindow: 131072,
  },
  {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen 3.8 27B',
    description: 'Strong multilingual reasoning and coding model with 131k context window',
    provider: 'Alibaba',
    speed: '~350 tokens/sec',
    badge: 'Reasoning',
    contextWindow: 131072,
  },
  {
    id: 'allam-2-7b',
    name: 'ALLaM 2 7B',
    description: 'Instruction-tuned bilingual model with 4k context window',
    provider: 'SDAIA',
    speed: '~450 tokens/sec',
    badge: 'Compact',
    contextWindow: 4096,
  },
];

const QUICK_STARTERS = [
  {
    icon: Code2,
    title: 'Code a React Hook',
    desc: 'Write a TypeScript custom useDebounce hook with cleanup',
    prompt: 'Write a clean, production-grade custom React hook in TypeScript called `useDebounce` with full type safety and an example component.',
  },
  {
    icon: Compass,
    title: 'Explore Complex Science',
    desc: 'Explain quantum computing & qubits simply',
    prompt: 'Explain quantum computing and how qubits differ from classical bits using an intuitive analogy suitable for a high-school student.',
  },
  {
    icon: Lightbulb,
    title: 'Speed Test & Benchmark',
    desc: 'Test Groq ultra-high token generation speed',
    prompt: 'Write a fast-paced science fiction story about the first artificial general intelligence deployed on a deep space probe.',
  },
  {
    icon: BookOpen,
    title: 'Architecture & System Design',
    desc: 'Design a distributed rate limiter in Redis',
    prompt: 'Explain how to design a distributed rate limiter using the Token Bucket algorithm with Redis and Node.js. Include trade-offs.',
  },
];

export default function App() {
  const [chats, setChats] = useState<ChatSession[]>(() => loadSavedChats());
  const [activeChatId, setActiveChatId] = useState<string>(() => {
    const loaded = loadSavedChats();
    return loaded[0]?.id || INITIAL_CHAT.id;
  });
  const [settings, setSettings] = useState<ChatSettings>(() => loadSavedSettings());
  const [models, setModels] = useState<GroqModelInfo[]>(DEFAULT_MODELS);
  const [isKeyConfigured, setIsKeyConfigured] = useState<boolean>(false);

  // Modals & Panels
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Input & Streaming
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Active chat session
  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0] || INITIAL_CHAT;

  // Sync chats to localStorage
  useEffect(() => {
    saveChats(chats);
  }, [chats]);

  // Sync settings to localStorage
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Fetch status & models from backend
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          setIsKeyConfigured(Boolean(data.configured));
          if (data.models && Array.isArray(data.models) && data.models.length > 0) {
            setModels(data.models);
            // If current model is not among active models, switch to defaultModel
            setSettings((prev) => {
              const exists = data.models.some((m: GroqModelInfo) => m.id === prev.model);
              if (!exists && data.defaultModel) {
                return { ...prev, model: data.defaultModel };
              }
              return prev;
            });
          }
        }
      } catch (e) {
        console.error('Error checking API status:', e);
      }
    };
    checkStatus();
  }, []);

  // Auto-scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages, isGenerating]);

  // Auto resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  // Create new chat
  const handleNewChat = () => {
    const newChat: ChatSession = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: settings.model,
      systemPrompt: settings.systemPrompt,
      messages: [],
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setIsSidebarOpen(false);
  };

  // Delete chat
  const handleDeleteChat = (id: string) => {
    setChats((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const fallback = {
          ...INITIAL_CHAT,
          id: `chat-${Date.now()}`,
          messages: [],
          title: 'New Conversation',
        };
        setActiveChatId(fallback.id);
        return [fallback];
      }
      if (id === activeChatId) {
        setActiveChatId(remaining[0].id);
      }
      return remaining;
    });
  };

  // Rename chat
  const handleRenameChat = (id: string, newTitle: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  // Clear all chats
  const handleClearAllChats = () => {
    const freshChat: ChatSession = {
      id: `chat-${Date.now()}`,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: settings.model,
      messages: [],
    };
    setChats([freshChat]);
    setActiveChatId(freshChat.id);
  };

  // Stop Generation
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);

    // mark active assistant message as not streaming
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== activeChatId) return chat;
        const updatedMsgs = chat.messages.map((msg) =>
          msg.isStreaming ? { ...msg, isStreaming: false } : msg
        );
        return { ...chat, messages: updatedMsgs };
      })
    );
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputPrompt).trim();
    if (!content || isGenerating) return;

    setInputPrompt('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content,
      createdAt: Date.now(),
    };

    const assistantMessageId = `asst-${Date.now()}`;
    const assistantPlaceholder: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      modelUsed: settings.model,
      isStreaming: true,
    };

    // Calculate auto title if this is the first turn
    const isFirstUserMsg =
      activeChat.messages.filter((m) => m.role === 'user').length === 0 ||
      activeChat.title === 'New Conversation' ||
      activeChat.title === 'Welcome to GroqChat';

    const newTitle = isFirstUserMsg
      ? content.slice(0, 32) + (content.length > 32 ? '...' : '')
      : activeChat.title;

    const updatedMessages = [...activeChat.messages, userMessage, assistantPlaceholder];

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              title: newTitle,
              updatedAt: Date.now(),
              messages: updatedMessages,
            }
          : c
      )
    );

    setIsGenerating(true);
    const startTime = Date.now();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          messages: [...activeChat.messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: settings.model,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          systemPrompt: settings.systemPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Readable stream not supported.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawJson = line.substring(6).trim();
            if (!rawJson) continue;

            try {
              const data = JSON.parse(rawJson);

              if (data.type === 'model_fallback' && data.activeModel) {
                setSettings((prev) => ({ ...prev, model: data.activeModel }));
              } else if (data.type === 'chunk' && data.content) {
                streamedText += data.content;
                setChats((prev) =>
                  prev.map((c) => {
                    if (c.id !== activeChatId) return c;
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMessageId
                          ? { ...m, content: streamedText, isStreaming: true }
                          : m
                      ),
                    };
                  })
                );
              } else if (data.type === 'error') {
                streamedText = data.message || 'An error occurred with the AI service.';
                setChats((prev) =>
                  prev.map((c) => {
                    if (c.id !== activeChatId) return c;
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMessageId
                          ? { ...m, content: streamedText, isStreaming: false }
                          : m
                      ),
                    };
                  })
                );
              } else if (data.type === 'done' && data.modelUsed) {
                // Track actual model used
                setSettings((prev) => ({ ...prev, model: data.modelUsed }));
              }
            } catch (err) {
              // ignore parse errors for partial chunks
            }
          }
        }
      }

      // Finish streaming
      const durationMs = Date.now() - startTime;
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== activeChatId) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    content: streamedText,
                    isStreaming: false,
                    durationMs,
                  }
                : m
            ),
          };
        })
      );
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        console.log('Stream generation aborted by user.');
      } else {
        const errorMsg = (err as Error)?.message || 'Failed to generate response.';
        setChats((prev) =>
          prev.map((c) => {
            if (c.id !== activeChatId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: `❌ Error: ${errorMsg}\n\n*Note: Make sure your Groq API key is configured. You can provide it directly to the assistant in chat.*`,
                      isStreaming: false,
                    }
                  : m
              ),
            };
          })
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last assistant response
  const handleRegenerate = () => {
    if (isGenerating || activeChat.messages.length < 2) return;
    const msgs = [...activeChat.messages];
    // Find last assistant msg
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg.role === 'assistant') {
      msgs.pop();
    }
    // Find last user msg
    const lastUserMsg = msgs[msgs.length - 1];
    if (lastUserMsg && lastUserMsg.role === 'user') {
      // remove last user message from state so handleSendMessage re-appends it cleanly
      msgs.pop();
      setChats((prev) =>
        prev.map((c) => (c.id === activeChatId ? { ...c, messages: msgs } : c))
      );
      handleSendMessage(lastUserMsg.content);
    }
  };

  // Edit and resend user message
  const handleEditUserMessage = (index: number, newContent: string) => {
    if (isGenerating) return;
    // Slice messages up to the edited one
    const trimmed = activeChat.messages.slice(0, index);
    setChats((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, messages: trimmed } : c))
    );
    handleSendMessage(newContent);
  };

  // Export current chat as Markdown
  const handleExportChat = () => {
    let md = `# ${activeChat.title}\nModel: ${activeChat.model}\nDate: ${new Date(
      activeChat.createdAt
    ).toLocaleString()}\n\n---\n\n`;

    for (const msg of activeChat.messages) {
      md += `### ${msg.role === 'user' ? 'You' : 'Groq Assistant'}\n\n${msg.content}\n\n---\n\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeChat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedModelObj =
    models.find((m) => m.id === settings.model) || models[0] || DEFAULT_MODELS[0];

  const isEmptyChat =
    activeChat.messages.length === 0 ||
    (activeChat.messages.length === 1 && activeChat.messages[0].id === 'msg-welcome-1');

  return (
    <div className="flex h-screen w-screen bg-[#0d0f12] text-neutral-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          setActiveChatId(id);
          setIsSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenApiKeyInfo={() => setIsApiKeyModalOpen(true)}
        isKeyConfigured={isKeyConfigured}
        selectedModel={settings.model}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 lg:pl-72 relative">
        {/* Top Navbar */}
        <header className="h-14 border-b border-neutral-800/80 bg-[#0d0f12]/90 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Model Selector Pill */}
            <button
              type="button"
              onClick={() => setIsModelModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs sm:text-sm font-medium text-neutral-200 hover:text-white transition-colors cursor-pointer shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span className="font-semibold">{selectedModelObj?.name}</span>
              <span className="text-[10px] text-neutral-500 hidden sm:inline">
                ({selectedModelObj?.speed})
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-1.5">
            {!isKeyConfigured && (
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs transition-colors cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Connect Groq Key</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportChat}
              title="Export as Markdown"
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleDeleteChat(activeChatId)}
              title="Delete conversation"
              className="p-2 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Chat Stream / Message List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">
          {isEmptyChat && activeChat.messages.length === 0 ? (
            /* Empty State Hero */
            <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[70vh] text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-neutral-950 shadow-xl shadow-amber-500/20 mb-5 ring-4 ring-amber-500/10">
                <Zap className="w-8 h-8 fill-current stroke-[2.5]" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
                What can I help you discover or build?
              </h2>
              <p className="text-sm text-neutral-400 max-w-md mb-8">
                Powered by Groq LPUs for lightning-fast token generation. Ask questions, build software, or generate ideas.
              </p>

              {/* Starter Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                {QUICK_STARTERS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(item.prompt)}
                      className="group p-4 rounded-2xl bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800/80 hover:border-amber-500/40 transition-all cursor-pointer shadow-sm text-left flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-neutral-800 group-hover:bg-amber-500/10 text-neutral-400 group-hover:text-amber-400 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-white text-sm group-hover:text-amber-300 transition-colors">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Render Messages */
            <div className="pb-36 pt-2">
              {activeChat.messages.map((msg, index) => {
                const isLastAssistant =
                  index === activeChat.messages.length - 1 && msg.role === 'assistant';
                return (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    isLastAssistant={isLastAssistant}
                    onRegenerate={handleRegenerate}
                    onEdit={
                      msg.role === 'user'
                        ? (newText) => handleEditUserMessage(index, newText)
                        : undefined
                    }
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Floating Composer / Input Area */}
        <div className="absolute bottom-0 left-0 right-0 lg:left-72 p-4 bg-gradient-to-t from-[#0d0f12] via-[#0d0f12]/95 to-transparent z-10 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            {/* Quick Action Chips */}
            <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              <span className="text-neutral-500 flex items-center gap-1 px-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Quick:
              </span>
              {[
                'Explain in simple terms',
                'Write TypeScript code',
                'Find and fix errors',
                'Summarize key points',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputPrompt((prev) => (prev ? `${prev} - ${chip}` : chip));
                    textareaRef.current?.focus();
                  }}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <div className="relative rounded-2xl bg-neutral-900/90 border border-neutral-800 focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/10 shadow-2xl transition-all">
              <textarea
                ref={textareaRef}
                value={inputPrompt}
                onChange={(e) => {
                  setInputPrompt(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder="Ask anything or enter a prompt (Shift+Enter for newline)..."
                className="w-full pl-4 pr-14 py-3.5 bg-transparent text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none resize-none max-h-48 leading-relaxed"
              />

              <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1">
                {isGenerating ? (
                  <button
                    type="button"
                    onClick={handleStopGenerating}
                    title="Stop generation"
                    className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 transition-colors cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputPrompt.trim()}
                    title="Send message"
                    className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-neutral-950 font-bold transition-all cursor-pointer shadow-md shadow-amber-500/20 disabled:shadow-none"
                  >
                    <Send className="w-4 h-4 fill-current" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 text-center mt-2">
              GroqChat runs on high-speed LPUs. Responses may contain errors; verify critical information.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ModelSelectorModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        models={models}
        selectedModel={settings.model}
        onSelectModel={(modelId) => setSettings((prev) => ({ ...prev, model: modelId }))}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
        onClearAllChats={handleClearAllChats}
      />

      <ApiKeyGuideModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        isKeyConfigured={isKeyConfigured}
      />
    </div>
  );
}
