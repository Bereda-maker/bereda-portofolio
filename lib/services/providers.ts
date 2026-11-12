export type SetupRequired = { status: 'setup_required'; provider: string; message: string; requiredEnvironmentVariables: string[] };
export type ProviderResult<T> = { status: 'ok'; data: T } | SetupRequired;
export type PaymentProvider = { createCheckout(input: { amountCents: number; currency: string; reference: string }): Promise<ProviderResult<{ checkoutUrl: string }>> };
export type StorageProvider = { createUpload(input: { filename: string; contentType: string }): Promise<ProviderResult<{ uploadUrl: string; storageKey: string }>> };
export type EmailProvider = { send(input: { to: string; subject: string; text: string }): Promise<ProviderResult<{ messageId: string }>> };
export type CalendarProvider = { createEvent(input: { title: string; startsAt: Date; endsAt: Date; attendeeEmail: string }): Promise<ProviderResult<{ eventId: string }>> };
export type AiMessage = { role: 'user' | 'assistant' | 'system'; content: string };
export type AiStreamEvent = { type: 'delta'; content: string } | { type: 'usage'; inputTokens?: number; outputTokens?: number };
export type AiProvider = { complete(input: { prompt: string; system?: string; json?: boolean }): Promise<ProviderResult<{ text: string }>>; chat(input: { messages: AiMessage[]; system?: string }): Promise<ProviderResult<{ text: string; inputTokens?: number; outputTokens?: number }>>; stream(input: { messages: AiMessage[]; system?: string }): Promise<ProviderResult<{ events: AsyncGenerator<AiStreamEvent>; model: string }>> };

async function providerError(response: Response, provider: string) {
  const raw = await response.text().catch(() => '');
  let detail = '';
  try {
    const body = JSON.parse(raw) as { error?: { message?: string } | string; message?: string };
    detail = typeof body.error === 'string' ? body.error : body.error?.message ?? body.message ?? '';
  } catch { detail = raw.replace(/\s+/g, ' ').slice(0, 300); }
  return new Error(`${provider} request failed (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ''}`);
}
function unconfigured(provider: string, requiredEnvironmentVariables: string[]): SetupRequired { return { status: 'setup_required', provider, requiredEnvironmentVariables, message: `${provider} is not configured. Add the required integration credentials before calling this provider.` }; }
function providerSettings() {
  const provider = process.env.AI_PROVIDER ?? 'openai';
  const baseUrl = (process.env.AI_BASE_URL ?? (provider === 'anthropic' ? 'https://api.anthropic.com/v1' : 'https://api.openai.com/v1')).replace(/\/$/, '');
  const model = process.env.AI_MODEL ?? (provider === 'anthropic' ? 'claude-3-5-haiku-latest' : 'gpt-4o-mini');
  return { provider, baseUrl, model, apiKey: process.env.AI_API_KEY };
}

export const paymentProvider: PaymentProvider = { async createCheckout() { return unconfigured('payment', ['PAYMENT_PROVIDER', 'PAYMENT_SECRET_KEY']); } };
export const storageProvider: StorageProvider = { async createUpload() { return unconfigured('storage', ['STORAGE_PROVIDER', 'STORAGE_BUCKET', 'STORAGE_ACCESS_KEY']); } };
export const emailProvider: EmailProvider = { async send() { return unconfigured('email', ['EMAIL_PROVIDER', 'EMAIL_API_KEY', 'EMAIL_FROM']); } };
export const calendarProvider: CalendarProvider = { async createEvent() { return unconfigured('calendar', ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI', 'GOOGLE_CALENDAR_ID']); } };

export const aiProvider: AiProvider = {
  async complete({ prompt, system, json = false }) {
    const { provider, baseUrl, model, apiKey } = providerSettings();
    if (!apiKey) return unconfigured('ai', ['AI_PROVIDER', 'AI_API_KEY']);
    try {
      if (provider === 'anthropic') {
        const response = await fetch(`${baseUrl}/messages`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model, max_tokens: 1800, system, messages: [{ role: 'user', content: prompt }] }) });
        if (!response.ok) throw await providerError(response, provider);
        const data = await response.json() as { content?: Array<{ text?: string }> };
        return { status: 'ok', data: { text: data.content?.map((part) => part.text ?? '').join('') ?? '' } };
      }
      const response = await fetch(`${baseUrl}/chat/completions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, temperature: 0.2, response_format: json ? { type: 'json_object' } : undefined, messages: [{ role: 'system', content: system ?? 'You are a careful career research assistant.' }, { role: 'user', content: prompt }] }) });
      if (!response.ok) throw await providerError(response, provider);
      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      return { status: 'ok', data: { text: data.choices?.[0]?.message?.content ?? '' } };
    } catch (error) { console.error('[aiProvider] completion failed:', error instanceof Error ? error.message : error); return { status: 'setup_required', provider, requiredEnvironmentVariables: ['AI_API_KEY'], message: error instanceof Error ? error.message : 'The configured AI provider could not complete the request.' }; }
  },
  async chat({ messages, system }) {
    const { provider, baseUrl, model, apiKey } = providerSettings();
    if (!apiKey) return unconfigured('ai', ['AI_PROVIDER', 'AI_API_KEY']);
    try {
      if (provider === 'anthropic') {
        const response = await fetch(`${baseUrl}/messages`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model, max_tokens: 1800, system, messages: messages.filter((message) => message.role !== 'system') }) });
        if (!response.ok) throw await providerError(response, provider);
        const data = await response.json() as { content?: Array<{ text?: string }>; usage?: { input_tokens?: number; output_tokens?: number } };
        return { status: 'ok', data: { text: data.content?.map((part) => part.text ?? '').join('') ?? '', inputTokens: data.usage?.input_tokens, outputTokens: data.usage?.output_tokens } };
      }
      const response = await fetch(`${baseUrl}/chat/completions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, temperature: 0.35, max_tokens: 1800, messages: [{ role: 'system', content: system ?? 'You are a careful personal planning assistant.' }, ...messages.filter((message) => message.role !== 'system')] }) });
      if (!response.ok) throw await providerError(response, provider);
      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number } };
      return { status: 'ok', data: { text: data.choices?.[0]?.message?.content ?? '', inputTokens: data.usage?.prompt_tokens, outputTokens: data.usage?.completion_tokens } };
    } catch (error) { console.error('[aiProvider] chat failed:', error instanceof Error ? error.message : error); return { status: 'setup_required', provider, requiredEnvironmentVariables: ['AI_API_KEY'], message: error instanceof Error ? error.message : 'The configured AI provider could not complete the request.' }; }
  },
  async stream({ messages, system }) {
    const { provider, baseUrl, model, apiKey } = providerSettings();
    if (!apiKey) return unconfigured('ai', ['AI_PROVIDER', 'AI_API_KEY']);
    if (provider === 'anthropic') return unconfigured('ai', ['AI_PROVIDER', 'AI_API_KEY']);
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, temperature: 0.35, max_tokens: 1800, stream: true, stream_options: { include_usage: true }, messages: [{ role: 'system', content: system ?? 'You are a careful personal planning assistant.' }, ...messages.filter((message) => message.role !== 'system')] }) });
      if (!response.ok || !response.body) throw await providerError(response, provider);
      const events = async function* (): AsyncGenerator<AiStreamEvent> {
        const reader = response.body!.getReader(); const decoder = new TextDecoder(); let buffer = '';
        try {
          while (true) {
            const { value, done } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n'); buffer = lines.pop() ?? '';
            for (const line of lines) {
              if (!line.startsWith('data:')) continue; const payload = line.slice(5).trim(); if (payload === '[DONE]') return;
              try { const parsed = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number } }; const delta = parsed.choices?.[0]?.delta?.content; if (delta) yield { type: 'delta', content: delta }; if (parsed.usage) yield { type: 'usage', inputTokens: parsed.usage.prompt_tokens, outputTokens: parsed.usage.completion_tokens }; } catch { /* Ignore incomplete provider frames. */ }
            }
          }
        } finally { reader.releaseLock(); }
      };
      return { status: 'ok', data: { events: events(), model } };
    } catch (error) { console.error('[aiProvider] stream failed:', error instanceof Error ? error.message : error); return { status: 'setup_required', provider, requiredEnvironmentVariables: ['AI_API_KEY'], message: error instanceof Error ? error.message : 'The configured AI provider could not stream a response.' }; }
  },
};
