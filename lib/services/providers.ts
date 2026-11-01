export type SetupRequired = { status: 'setup_required'; provider: string; message: string; requiredEnvironmentVariables: string[] };
export type ProviderResult<T> = { status: 'ok'; data: T } | SetupRequired;
export type PaymentProvider = { createCheckout(input: { amountCents: number; currency: string; reference: string }): Promise<ProviderResult<{ checkoutUrl: string }>> };
export type StorageProvider = { createUpload(input: { filename: string; contentType: string }): Promise<ProviderResult<{ uploadUrl: string; storageKey: string }>> };
export type EmailProvider = { send(input: { to: string; subject: string; text: string }): Promise<ProviderResult<{ messageId: string }>> };
export type CalendarProvider = { createEvent(input: { title: string; startsAt: Date; endsAt: Date; attendeeEmail: string }): Promise<ProviderResult<{ eventId: string }>> };
export type AiProvider = { complete(input: { prompt: string; system?: string; json?: boolean }): Promise<ProviderResult<{ text: string }>> };

async function providerError(response: Response, provider: string) {
  const raw = await response.text().catch(() => '');
  let detail = '';
  try {
    const body = JSON.parse(raw) as { error?: { message?: string } | string; message?: string };
    detail = typeof body.error === 'string' ? body.error : body.error?.message ?? body.message ?? '';
  } catch {
    detail = raw.replace(/\s+/g, ' ').slice(0, 300);
  }
  return new Error(`${provider} request failed (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ''}`);
}

function unconfigured(provider: string, requiredEnvironmentVariables: string[]): SetupRequired {
  return { status: 'setup_required', provider, requiredEnvironmentVariables, message: `${provider} is not configured. Add the required integration credentials before calling this provider.` };
}

export const paymentProvider: PaymentProvider = { async createCheckout() { return unconfigured('payment', ['PAYMENT_PROVIDER', 'PAYMENT_SECRET_KEY']); } };
export const storageProvider: StorageProvider = { async createUpload() { return unconfigured('storage', ['STORAGE_PROVIDER', 'STORAGE_BUCKET', 'STORAGE_ACCESS_KEY']); } };
export const emailProvider: EmailProvider = { async send() { return unconfigured('email', ['EMAIL_PROVIDER', 'EMAIL_API_KEY', 'EMAIL_FROM']); } };
export const calendarProvider: CalendarProvider = { async createEvent() { return unconfigured('calendar', ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI', 'GOOGLE_CALENDAR_ID']); } };

export const aiProvider: AiProvider = {
  async complete({ prompt, system, json = false }) {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) return unconfigured('ai', ['AI_PROVIDER', 'AI_API_KEY']);

    const provider = process.env.AI_PROVIDER ?? 'openai';
    const baseUrl = (process.env.AI_BASE_URL ?? (provider === 'anthropic' ? 'https://api.anthropic.com/v1' : 'https://api.openai.com/v1')).replace(/\/$/, '');
    const model = process.env.AI_MODEL ?? (provider === 'anthropic' ? 'claude-3-5-haiku-latest' : 'gpt-4o-mini');

    try {
      if (provider === 'anthropic') {
        const response = await fetch(`${baseUrl}/messages`, {
          method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model, max_tokens: 1800, system, messages: [{ role: 'user', content: prompt }] }),
        });
        if (!response.ok) throw await providerError(response, provider);
        const data = await response.json() as { content?: Array<{ text?: string }> };
        return { status: 'ok', data: { text: data.content?.map((part) => part.text ?? '').join('') ?? '' } };
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, temperature: 0.2, response_format: json ? { type: 'json_object' } : undefined, messages: [{ role: 'system', content: system ?? 'You are a careful career research assistant.' }, { role: 'user', content: prompt }] }),
      });
      if (!response.ok) throw await providerError(response, provider);
      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      return { status: 'ok', data: { text: data.choices?.[0]?.message?.content ?? '' } };
    } catch (error) {
      console.error('[aiProvider] completion failed:', error instanceof Error ? error.message : error);
      return { status: 'setup_required', provider, requiredEnvironmentVariables: ['AI_API_KEY'], message: error instanceof Error ? error.message : 'The configured AI provider could not complete the request.' };
    }
  },
};
