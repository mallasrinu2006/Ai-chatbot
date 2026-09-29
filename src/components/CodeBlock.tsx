import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const displayLang = (language || 'plaintext').replace(/^lang-/, '').replace(/^language-/, '');

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-neutral-800 bg-[#0d1117] shadow-lg text-sm font-mono">
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/90 border-b border-neutral-800 text-xs text-neutral-400">
        <span className="font-semibold uppercase tracking-wider text-amber-500/90">{displayLang}</span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-neutral-100 leading-relaxed scrollbar-thin scrollbar-thumb-neutral-700">
        <pre className="!bg-transparent !p-0 !m-0 font-mono text-sm leading-6">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
