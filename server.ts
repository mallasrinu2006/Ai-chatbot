import express from 'express';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

interface FormattedModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  speed: string;
  badge: string;
  contextWindow: number;
}

let cachedModels: FormattedModel[] = [];
let lastFetchedTime = 0;

// Fetch live models from Groq API for this key
async function getAvailableGroqModels(apiKey: string): Promise<FormattedModel[]> {
  const now = Date.now();
  if (cachedModels.length > 0 && now - lastFetchedTime < 60_000) {
    return cachedModels;
  }

  try {
    const groq = new Groq({ apiKey });
    const response = await groq.models.list();
    const rawList = response.data || [];

    // Filter to usable chat completion models (active, text output, excluding whisper/prompt-guard)
    const validChatModels = rawList.filter((m: any) => {
      if (m.active === false) return false;
      const id = m.id.toLowerCase();
      if (id.includes('whisper') || id.includes('prompt-guard') || id.includes('safeguard')) {
        return false;
      }
      // Check output modality
      const outMods = m.output_modalities || [];
      if (outMods.length > 0 && !outMods.includes('text')) {
        return false;
      }
      return true;
    });

    const formatted: FormattedModel[] = validChatModels.map((m: any) => {
      const id: string = m.id;
      let name = m.name || id;
      let provider = m.owned_by || 'Groq';
      let badge = '';
      let speed = '~300 tokens/sec';
      let description = `High-speed inference model with ${Math.round((m.context_window || 128000) / 1000)}k context.`;

      if (id === 'openai/gpt-oss-120b') {
        name = 'GPT OSS 120B';
        provider = 'OpenAI';
        badge = 'Flagship';
        speed = '~280 tokens/sec';
        description = 'Top tier open-weights intelligence with reasoning & 131k context window';
      } else if (id === 'openai/gpt-oss-20b') {
        name = 'GPT OSS 20B';
        provider = 'OpenAI';
        badge = 'Ultra Fast';
        speed = '~650 tokens/sec';
        description = 'Compact, highly responsive reasoning model with 131k context window';
      } else if (id === 'qwen/qwen3.8-27b') {
        name = 'Qwen 3.8 27B';
        provider = 'Alibaba';
        badge = 'Reasoning';
        speed = '~350 tokens/sec';
        description = 'Strong multilingual reasoning and coding model with 131k context window';
      } else if (id.includes('llama-3.3-70b')) {
        name = 'Llama 3.3 70B';
        provider = 'Meta';
        badge = 'Recommended';
        speed = '~280 tokens/sec';
        description = 'Meta flagship 70B model with high general reasoning';
      } else if (id.includes('llama-3.1-8b')) {
        name = 'Llama 3.1 8B';
        provider = 'Meta';
        badge = 'Ultra Fast';
        speed = '~800 tokens/sec';
        description = 'Fastest lightweight 8B model for quick answers';
      } else if (id === 'allam-2-7b') {
        name = 'ALLaM 2 7B';
        provider = 'SDAIA';
        badge = 'Arabic/English';
        speed = '~450 tokens/sec';
        description = 'Instruction-tuned bilingual model with 4k context window';
      }

      return {
        id,
        name,
        description,
        provider,
        speed,
        badge,
        contextWindow: m.context_window || 128000,
      };
    });

    if (formatted.length > 0) {
      cachedModels = formatted;
      lastFetchedTime = now;
      return formatted;
    }
  } catch (err) {
    console.error('Failed to list Groq models dynamically:', err);
  }

  // Fallback defaults
  return [
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
      badge: 'Reasoning',
      speed: '~350 tokens/sec',
      contextWindow: 131072,
    },
  ];
}

// Check status & get models available for current key
app.get('/api/status', async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  const hasKey = Boolean(apiKey && apiKey !== '');

  let availableModels: FormattedModel[] = [];
  let defaultModel = 'openai/gpt-oss-120b';

  if (hasKey && apiKey) {
    availableModels = await getAvailableGroqModels(apiKey);
    if (availableModels.length > 0) {
      // Pick best flagship as default
      const preferred = availableModels.find((m) => m.id === 'openai/gpt-oss-120b') || availableModels[0];
      defaultModel = preferred.id;
    }
  }

  res.json({
    configured: hasKey,
    defaultModel,
    models: availableModels,
  });
});

// Get available models
app.get('/api/models', async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (apiKey) {
    const models = await getAvailableGroqModels(apiKey);
    return res.json({ models });
  }
  res.json({ models: [] });
});

// Chat completion with streaming
app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  // Set SSE headers for streaming
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (data: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  if (!apiKey) {
    sendEvent({
      type: 'error',
      code: 'MISSING_API_KEY',
      message:
        'Groq API Key is not set on the server yet. Please reply to me in the chat with your Groq API key (starting with `gsk_...`), and I will configure it immediately for you!',
    });
    sendEvent({ type: 'done' });
    res.end();
    return;
  }

  const {
    messages = [],
    model = 'openai/gpt-oss-120b',
    temperature = 0.7,
    max_tokens = 4096,
    systemPrompt = '',
  } = req.body;

  try {
    const groq = new Groq({ apiKey });

    // Validate if the requested model is accessible; if not, fall back to best available active model
    const available = await getAvailableGroqModels(apiKey);
    let targetModel = model;
    const modelExists = available.some((m) => m.id === targetModel);

    if (!modelExists) {
      const fallback = available.find((m) => m.id === 'openai/gpt-oss-120b') ||
        available.find((m) => m.id === 'openai/gpt-oss-20b') ||
        available[0];
      if (fallback) {
        console.log(`Requested model "${targetModel}" not in account. Auto-migrating to "${fallback.id}".`);
        targetModel = fallback.id;
        // Inform client of model auto-migration
        sendEvent({
          type: 'model_fallback',
          originalModel: model,
          activeModel: targetModel,
        });
      }
    }

    const formattedMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    if (systemPrompt && systemPrompt.trim()) {
      formattedMessages.push({
        role: 'system',
        content: systemPrompt.trim(),
      });
    }

    for (const msg of messages) {
      if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') {
        formattedMessages.push({
          role: msg.role,
          content: msg.content || '',
        });
      }
    }

    const stream = await groq.chat.completions.create({
      messages: formattedMessages,
      model: targetModel,
      temperature: Number(temperature) || 0.7,
      max_tokens: Number(max_tokens) || 4096,
      stream: true,
    });

    for await (const chunk of stream) {
      const deltaContent = chunk.choices[0]?.delta?.content || '';
      if (deltaContent) {
        sendEvent({
          type: 'chunk',
          content: deltaContent,
        });
      }
    }

    sendEvent({ type: 'done', modelUsed: targetModel });
    res.end();
  } catch (err: unknown) {
    const errorObj = err as { message?: string; status?: number; error?: { message?: string } };
    const errMsg = errorObj.error?.message || errorObj.message || 'Unknown error occurred while contacting Groq API.';
    sendEvent({
      type: 'error',
      message: errMsg,
    });
    sendEvent({ type: 'done' });
    res.end();
  }
});

// Vite middleware in dev or static files in production
async function setupApp() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`GroqChat server running on http://localhost:${port}`);
  });
}

setupApp();
