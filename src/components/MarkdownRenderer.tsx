import React from 'react';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Split content by code blocks: ```[lang]\n[code]\n```
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Text before the code block
    if (match.index > lastIndex) {
      const textBefore = content.substring(lastIndex, match.index);
      parts.push(
        <div key={`text-${lastIndex}`} className="prose-body">
          {renderFormattedText(textBefore)}
        </div>
      );
    }

    const lang = match[1] || 'plaintext';
    const code = match[2];
    parts.push(<CodeBlock key={`code-${match.index}`} language={lang} code={code} />);

    lastIndex = match.index + match[0].length;
  }

  // Trailing text or unclosed code fence during streaming
  if (lastIndex < content.length) {
    const trailing = content.substring(lastIndex);
    // Check if there is an unclosed code block currently streaming: ```lang\ncode...
    const unclosedMatch = trailing.match(/```([a-zA-Z0-9_-]*)\n?([\s\S]*)$/);
    if (unclosedMatch) {
      const textBeforeUnclosed = trailing.substring(0, unclosedMatch.index || 0);
      if (textBeforeUnclosed) {
        parts.push(
          <div key={`text-${lastIndex}-unclosed`} className="prose-body">
            {renderFormattedText(textBeforeUnclosed)}
          </div>
        );
      }
      parts.push(
        <CodeBlock
          key={`code-streaming-${lastIndex}`}
          language={unclosedMatch[1] || 'plaintext'}
          code={unclosedMatch[2] || ''}
        />
      );
    } else {
      parts.push(
        <div key={`text-trailing-${lastIndex}`} className="prose-body">
          {renderFormattedText(trailing)}
        </div>
      );
    }
  }

  return <div className="space-y-2 text-neutral-100 leading-relaxed break-words">{parts}</div>;
};

// Formats basic markdown elements: headers, bold, italics, inline code, lists, blockquotes
function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let isNumberedList = false;

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      if (isNumberedList) {
        elements.push(
          <ol key={key} className="list-decimal list-inside space-y-1.5 my-2.5 pl-2 text-neutral-200">
            {listItems}
          </ol>
        );
      } else {
        elements.push(
          <ul key={key} className="list-disc list-inside space-y-1.5 my-2.5 pl-2 text-neutral-200">
            {listItems}
          </ul>
        );
      }
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Bullet list: - or *
    const bulletMatch = line.match(/^(\s*)([-*])\s+(.+)$/);
    if (bulletMatch) {
      if (inList && isNumberedList) flushList(`flush-num-${i}`);
      inList = true;
      isNumberedList = false;
      listItems.push(<li key={`li-${i}`}>{formatInlineTokens(bulletMatch[3])}</li>);
      continue;
    }

    // Numbered list: 1.
    const numMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
    if (numMatch) {
      if (inList && !isNumberedList) flushList(`flush-bullet-${i}`);
      inList = true;
      isNumberedList = true;
      listItems.push(<li key={`num-li-${i}`}>{formatInlineTokens(numMatch[3])}</li>);
      continue;
    }

    // Flush any pending list
    flushList(`list-before-${i}`);

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-lg font-bold text-white mt-4 mb-2">
          {formatInlineTokens(line.substring(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-xl font-bold text-white mt-5 mb-2 pb-1 border-b border-neutral-800">
          {formatInlineTokens(line.substring(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-2xl font-extrabold text-white mt-6 mb-3">
          {formatInlineTokens(line.substring(2))}
        </h1>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-4 border-amber-500/80 bg-neutral-900/50 pl-3 py-1 my-2 italic text-neutral-300 rounded-r"
        >
          {formatInlineTokens(line.substring(2))}
        </blockquote>
      );
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      elements.push(<div key={`blank-${i}`} className="h-2" />);
      continue;
    }

    // Normal paragraph line
    elements.push(
      <p key={`p-${i}`} className="my-1.5 leading-relaxed text-neutral-200">
        {formatInlineTokens(line)}
      </p>
    );
  }

  flushList(`final-list`);

  return <>{elements}</>;
}

// Parses inline bold (**text**), italics (*text*), and inline code (`code`)
function formatInlineTokens(line: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Tokenizer regex for `code`, **bold**, *italic*
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={`inline-code-${match.index}`}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-neutral-800 text-amber-300 font-mono text-[0.875em] border border-neutral-700/60"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`bold-${match.index}`} className="font-bold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={`italic-${match.index}`} className="italic text-neutral-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < line.length) {
    parts.push(line.substring(lastIndex));
  }

  return parts;
}
