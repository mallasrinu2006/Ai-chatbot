import React, { useState } from 'react';
import { X, Sliders, RotateCcw, Trash2, Check, Sparkles } from 'lucide-react';
import { ChatSettings } from '../types';
import { DEFAULT_SETTINGS } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ChatSettings;
  onSaveSettings: (settings: ChatSettings) => void;
  onClearAllChats: () => void;
}

const PRESET_PERSONAS = [
  {
    name: 'General Assistant',
    prompt:
      'You are GroqChat, a fast, helpful, and thoughtful AI assistant powered by Groq LPU inference. Answer clearly, accurately, and format code snippets in markdown with language tags.',
  },
  {
    name: 'Senior Software Engineer',
    prompt:
      'You are a staff-level software architect. Provide production-grade, bug-free, clean TypeScript/Python/Rust code with best design patterns, edge-case coverage, and concise explanations.',
  },
  {
    name: 'Ultra Concise & Direct',
    prompt:
      'Answer directly without boilerplate, pleasantries, or preamble. Use bullet points and code where applicable. Focus exclusively on precision.',
  },
  {
    name: 'Academic Researcher & Educator',
    prompt:
      'Explain concepts with depth, first-principles logic, intuitive analogies, and rigorous accuracy. Cite theoretical concepts and trade-offs clearly.',
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onClearAllChats,
}) => {
  const [current, setCurrent] = useState<ChatSettings>(settings);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(current);
    onClose();
  };

  const handleReset = () => {
    setCurrent(DEFAULT_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-neutral-800 text-neutral-300">
              <Sliders className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Chat & Model Settings</h3>
              <p className="text-xs text-neutral-400">Configure parameters & assistant instructions</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-sm">
          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <label className="font-semibold text-white">Temperature: {current.temperature}</label>
                <p className="text-xs text-neutral-400">
                  Lower is deterministic and focused; higher is more creative.
                </p>
              </div>
              <span className="font-mono text-xs px-2 py-1 bg-neutral-800 text-amber-400 rounded-md">
                {current.temperature < 0.3 ? 'Deterministic' : current.temperature > 0.9 ? 'Creative' : 'Balanced'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={current.temperature}
              onChange={(e) => setCurrent({ ...current, temperature: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <label className="font-semibold text-white">Max Output Tokens: {current.maxTokens}</label>
                <p className="text-xs text-neutral-400">Maximum length of the generated response</p>
              </div>
              <span className="font-mono text-xs px-2 py-1 bg-neutral-800 text-neutral-300 rounded-md">
                {current.maxTokens} tokens
              </span>
            </div>
            <input
              type="range"
              min="512"
              max="8192"
              step="256"
              value={current.maxTokens}
              onChange={(e) => setCurrent({ ...current, maxTokens: parseInt(e.target.value, 10) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* System Instructions */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-white">System Prompt</label>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-amber-400 font-medium">Quick Presets</span>
              </div>
            </div>

            {/* Presets Chips */}
            <div className="flex flex-wrap gap-2">
              {PRESET_PERSONAS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setCurrent({ ...current, systemPrompt: p.prompt })}
                  className="px-2.5 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700/60 transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              value={current.systemPrompt}
              onChange={(e) => setCurrent({ ...current, systemPrompt: e.target.value })}
              placeholder="Enter system prompt for the model..."
              className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono leading-relaxed"
            />
          </div>

          {/* Clear All Chats */}
          <div className="pt-4 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-rose-400">Clear Conversation History</p>
                <p className="text-xs text-neutral-500">Permanently delete all saved local chat sessions</p>
              </div>

              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllChats();
                      setConfirmClear(false);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-2.5 py-1.5 bg-neutral-800 text-neutral-300 text-xs rounded-lg hover:bg-neutral-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-900/60 bg-rose-950/20 text-rose-400 hover:bg-rose-950/40 text-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete All</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
