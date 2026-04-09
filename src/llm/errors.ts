export function explainLlmError(status: number, bodyText: string): string {
  const lower = bodyText.toLowerCase();

  if (status === 401 || status === 403) {
    return [
      `LLM authentication failed (${status}).`,
      'Likely causes:',
      '- wrong API key',
      '- wrong base URL for this provider',
      '- API key belongs to a different provider/account',
      '- expired/revoked key',
      'Recommended next step:',
      'Retry with explicit session overrides, for example:',
      'rocketclaw2 --llm-base-url "https://api.openai.com/v1" --llm-api-key "$API_KEY" --llm-model "gpt-4o-mini" llm-query --prompt "Say hello"',
      `Provider response: ${bodyText}`,
    ].join('\n');
  }

  if (status === 404) {
    return [
      'LLM endpoint not found (404).',
      'This usually means the base URL is wrong or the provider path is incompatible with /chat/completions.',
      `Provider response: ${bodyText}`,
    ].join('\n');
  }

  if (status === 429) {
    return [
      'LLM rate limit hit (429).',
      'Wait and retry, or check provider quotas/rate limits.',
      `Provider response: ${bodyText}`,
    ].join('\n');
  }

  if (lower.includes('model')) {
    return [
      `LLM request failed (${status}).`,
      'The configured model may be invalid or unavailable for this provider/account.',
      `Provider response: ${bodyText}`,
    ].join('\n');
  }

  return `LLM query failed (${status}). Provider response: ${bodyText}`;
}
