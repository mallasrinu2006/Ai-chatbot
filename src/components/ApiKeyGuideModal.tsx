import React from 'react';
import { X, KeyRound, ExternalLink, CheckCircle2, ShieldAlert, Zap } from 'lucide-react';

interface ApiKeyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isKeyConfigured: boolean;
}

export const ApiKeyGuideModal: React.FC<ApiKeyGuideModalProps> = ({
  isOpen,
  onClose,
  isKeyConfigured,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Groq API Key Setup</h3>
              <p className="text-xs text-neutral-400">How your Groq API key is connected</p>
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

        {/* Body */}
        <div className="p-5 space-y-4 text-sm text-neutral-300 leading-relaxed">
          {/* Status banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              isKeyConfigured
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
            }`}
          >
            {isKeyConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <p className="font-semibold text-sm">
                {isKeyConfigured ? 'Groq Key is Connected' : 'Waiting for Groq API Key'}
              </p>
              <p className="opacity-90">
                {isKeyConfigured
                  ? 'Your server is connected to Groq Cloud. You can chat with high-speed models instantly.'
                  : 'You mentioned you have a Groq API key! You can reply to the assistant right in the chat with your key (e.g., `gsk_...`), and it will be wired up.'}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              How to obtain a free Groq Key:
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-xs text-neutral-300 pl-1">
              <li>
                Visit the Groq Cloud Console at{' '}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline inline-flex items-center gap-1 font-mono font-medium"
                >
                  console.groq.com/keys <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Sign in with your Google or GitHub account.</li>
              <li>Click <strong className="text-white">Create API Key</strong> and copy the generated key (starts with <code className="bg-neutral-800 px-1 py-0.5 rounded text-amber-300">gsk_...</code>).</li>
              <li>Send it to the assistant in this conversation or set the <code className="bg-neutral-800 px-1 py-0.5 rounded text-amber-300">GROQ_API_KEY</code> environment variable.</li>
            </ol>
          </div>

          <div className="p-3 bg-neutral-800/50 rounded-xl border border-neutral-800 flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs text-neutral-400">
              Groq LPUs process open-source models (Llama 3.3 70B, Llama 3.1 8B, DeepSeek) at up to 800+ tokens per second with near-instant time-to-first-token.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-800 bg-neutral-900/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
