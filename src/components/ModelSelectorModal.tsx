import React from 'react';
import { X, Check, Zap, Sparkles, Cpu, Gauge } from 'lucide-react';
import { GroqModelInfo } from '../types';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: GroqModelInfo[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  isOpen,
  onClose,
  models,
  selectedModel,
  onSelectModel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Select AI Model</h3>
              <p className="text-xs text-neutral-400">All models powered by Groq LPU™ acceleration</p>
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

        {/* Model List */}
        <div className="p-5 overflow-y-auto space-y-3">
          {models.map((model) => {
            const isSelected = model.id === selectedModel;

            return (
              <div
                key={model.id}
                onClick={() => {
                  onSelectModel(model.id);
                  onClose();
                }}
                className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5'
                    : 'bg-neutral-800/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-sm">{model.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-400 border border-neutral-700">
                        {model.provider}
                      </span>
                      {model.badge && (
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            model.badge === 'Recommended'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {model.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">{model.description}</p>
                    <div className="flex items-center gap-4 pt-1 text-[11px] text-neutral-500">
                      <span className="flex items-center gap-1 font-mono text-amber-400/90">
                        <Gauge className="w-3 h-3" />
                        {model.speed}
                      </span>
                      <span>Context: {(model.contextWindow / 1000).toFixed(0)}k tokens</span>
                    </div>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500 text-neutral-950 font-bold'
                          : 'border-neutral-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
