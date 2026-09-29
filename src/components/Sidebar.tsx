import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Settings,
  Zap,
  Search,
  KeyRound,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  chats: ChatSession[];
  activeChatId: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenApiKeyInfo: () => void;
  isKeyConfigured: boolean;
  selectedModel: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  isOpen,
  onClose,
  onOpenSettings,
  onOpenApiKeyInfo,
  isKeyConfigured,
  selectedModel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group chats by date
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  const todayChats = filteredChats.filter((c) => now - c.updatedAt < ONE_DAY);
  const yesterdayChats = filteredChats.filter(
    (c) => now - c.updatedAt >= ONE_DAY && now - c.updatedAt < 2 * ONE_DAY
  );
  const olderChats = filteredChats.filter((c) => now - c.updatedAt >= 2 * ONE_DAY);

  const startRename = (chat: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const saveRename = (chatId: string) => {
    if (editTitle.trim()) {
      onRenameChat(chatId, editTitle.trim());
    }
    setEditingId(null);
  };

  const renderChatGroup = (title: string, groupChats: ChatSession[]) => {
    if (groupChats.length === 0) return null;
    return (
      <div className="mb-4">
        <h4 className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500 px-3 mb-1.5">
          {title}
        </h4>
        <div className="space-y-1">
          {groupChats.map((chat) => {
            const isActive = chat.id === activeChatId;
            const isEditing = chat.id === editingId;

            return (
              <div
                key={chat.id}
                onClick={() => {
                  if (!isEditing) onSelectChat(chat.id);
                }}
                className={`group relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all ${
                  isActive
                    ? 'bg-neutral-800 text-white font-medium shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-amber-400' : 'text-neutral-500'
                    }`}
                  />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(chat.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      className="bg-neutral-900 text-white px-2 py-0.5 rounded text-xs w-full focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  ) : (
                    <span className="truncate text-xs sm:text-[13px]">{chat.title}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          saveRename(chat.id);
                        }}
                        className="p-1 hover:text-emerald-400 text-neutral-400 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(null);
                        }}
                        className="p-1 hover:text-rose-400 text-neutral-400 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => startRename(chat, e)}
                        title="Rename chat"
                        className="p-1 hover:text-white text-neutral-500 hover:bg-neutral-700/60 rounded transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                        title="Delete chat"
                        className="p-1 hover:text-rose-400 text-neutral-500 hover:bg-neutral-700/60 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#121316] border-r border-neutral-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & New Chat */}
        <div className="p-4 border-b border-neutral-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-neutral-950 font-black shadow-md shadow-amber-500/20">
                <Zap className="w-4 h-4 fill-current stroke-[2.5]" />
              </div>
              <div>
                <span className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
                  GroqChat
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    LPU
                  </span>
                </span>
                <p className="text-[11px] text-neutral-500">Ultra-fast AI inference</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700/80 text-white text-sm font-medium border border-neutral-700/60 shadow-sm transition-all hover:border-neutral-600 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>New Chat</span>
          </button>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin scrollbar-thumb-neutral-800">
          {chats.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-xs">
              No conversations yet
            </div>
          ) : (
            <>
              {renderChatGroup('Today', todayChats)}
              {renderChatGroup('Yesterday', yesterdayChats)}
              {renderChatGroup('Previous 7 Days', olderChats)}
            </>
          )}
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-neutral-800/80 bg-[#121316] space-y-2">
          {/* API Key Status Pill */}
          <button
            type="button"
            onClick={onOpenApiKeyInfo}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors cursor-pointer border ${
              isKeyConfigured
                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300 hover:bg-emerald-950/50'
                : 'bg-amber-950/30 border-amber-800/40 text-amber-300 hover:bg-amber-950/50'
            }`}
          >
            <div className="flex items-center gap-2">
              {isKeyConfigured ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <div className="text-left">
                <p className="font-semibold leading-tight">
                  {isKeyConfigured ? 'Groq Key Active' : 'Groq Key Needed'}
                </p>
                <p className="text-[10px] opacity-75">
                  {isKeyConfigured ? 'Fast inference enabled' : 'Tell assistant your key'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          {/* Model info & Settings */}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs border border-neutral-800/80 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-400" />
              <span className="truncate">Settings & Prompts</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
