import React, { useState } from 'react';
import { Bot, User, Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, Zap, Clock, Edit2 } from 'lucide-react';
import { Message } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatMessageProps {
  message: Message;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLastAssistant,
  onRegenerate,
  onEdit,
}) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleSaveEdit = () => {
    if (editText.trim() && onEdit) {
      onEdit(editText.trim());
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`group w-full py-5 px-4 sm:px-6 transition-colors ${
        isUser ? 'bg-transparent' : 'bg-neutral-900/40 border-y border-neutral-800/40'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-4 items-start">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-amber-500/10 ring-1 ring-white/20">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-neutral-950 font-extrabold shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/40">
              <Zap className="w-4 h-4 fill-current stroke-[2.5]" />
            </div>
          )}
        </div>

        {/* Message Content Container */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-200">
                {isUser ? 'You' : 'Groq Assistant'}
              </span>
              {!isUser && message.modelUsed && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700/60">
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                  {message.modelUsed}
                </span>
              )}
              {!isUser && message.durationMs && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-500">
                  <Clock className="w-2.5 h-2.5" />
                  {(message.durationMs / 1000).toFixed(2)}s
                </span>
              )}
            </div>

            {/* Action Bar (Top Right) */}
            <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-1 text-neutral-400">
              {isUser && onEdit && !isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  title="Edit message"
                  className="p-1 rounded-md hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={handleCopy}
                title="Copy text"
                className="p-1 rounded-md hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Body Content */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-y"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold rounded-md transition-colors"
                >
                  Save & Resend
                </button>
              </div>
            </div>
          ) : (
            <div className="text-neutral-100 text-[15px] leading-relaxed">
              <MarkdownRenderer content={message.content} />

              {/* Streaming Cursor */}
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse rounded-sm align-middle" />
              )}
            </div>
          )}

          {/* Footer Actions for Assistant */}
          {!isUser && !message.isStreaming && message.content.length > 0 && (
            <div className="mt-3.5 pt-2 flex items-center gap-2 border-t border-neutral-800/40 text-xs text-neutral-400">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-neutral-800 hover:text-neutral-200 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              {isLastAssistant && onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-neutral-800 hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>
              )}

              <div className="h-3 w-px bg-neutral-800 mx-1" />

              <button
                type="button"
                onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                title="Good response"
                className={`p-1.5 rounded-md hover:bg-neutral-800 transition-colors cursor-pointer ${
                  feedback === 'up' ? 'text-emerald-400 bg-neutral-800' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                title="Bad response"
                className={`p-1.5 rounded-md hover:bg-neutral-800 transition-colors cursor-pointer ${
                  feedback === 'down' ? 'text-rose-400 bg-neutral-800' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
