import type { AppConfig } from '../config/load-config.js';

export async function runLlmQuery(config: AppConfig, prompt: string): Promise<string> {
  if (!config.llm.apiKey) {
    throw new Error('No LLM API key configured. Set llm.apiKey in config.yaml or pass --llm-api-key for this session.');
  }

  const response = await fetch(`${config.llm.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.llm.apiKey}`,
    },
    body: JSON.stringify({
      model: config.llm.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LLM query failed: ${response.status} ${text}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('LLM query returned no message content.');
  }

  return content;
}
