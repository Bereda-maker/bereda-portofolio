export type SetupRequired = { status: 'setup_required'; provider: string; message: string; requiredEnvironmentVariables: string[] };
export type ProviderResult<T> = { status: 'ok'; data: T } | SetupRequired;
export type PaymentProvider = { createCheckout(input: { amountCents: number; currency: string; reference: string }): Promise<ProviderResult<{ checkoutUrl: string }>> };
export type StorageProvider = { createUpload(input: { filename: string; contentType: string }): Promise<ProviderResult<{ uploadUrl: string; storageKey: string }>> };
export type EmailProvider = { send(input: { to: string; subject: string; text: string }): Promise<ProviderResult<{ messageId: string }>> };
export type CalendarProvider = { createEvent(input: { title: string; startsAt: Date; endsAt: Date; attendeeEmail: string }): Promise<ProviderResult<{ eventId: string }>> };
export type AiProvider = { complete(input: { prompt: string }): Promise<ProviderResult<{ text: string }>> };

function unconfigured(provider: string, requiredEnvironmentVariables: string[]): SetupRequired { return { status: 'setup_required', provider, requiredEnvironmentVariables, message: `${provider} is not configured. Add the required integration credentials before calling this provider.` }; }
export const paymentProvider: PaymentProvider = { async createCheckout() { return unconfigured('payment', ['PAYMENT_PROVIDER', 'PAYMENT_SECRET_KEY']); } };
export const storageProvider: StorageProvider = { async createUpload() { return unconfigured('storage', ['STORAGE_PROVIDER', 'STORAGE_BUCKET', 'STORAGE_ACCESS_KEY']); } };
export const emailProvider: EmailProvider = { async send() { return unconfigured('email', ['EMAIL_PROVIDER', 'EMAIL_API_KEY', 'EMAIL_FROM']); } };
export const calendarProvider: CalendarProvider = { async createEvent() { return unconfigured('calendar', ['CALENDAR_PROVIDER', 'CALENDAR_API_KEY', 'CALENDAR_ID']); } };
export const aiProvider: AiProvider = { async complete() { return unconfigured('ai', ['AI_PROVIDER', 'AI_API_KEY']); } };
