import { auditLogs } from '@/lib/schema';

export type AuditEventInput = {
  action: string;
  entityType: string;
  entityId?: string | number | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  requestId?: string | null;
};

const SAFE_VALUE = /^(?:string|number|boolean)$/;
const SENSITIVE_KEY = /email|phone|token|secret|password|address|message|bio|notes|resume|cover.?letter|authorization|cookie/i;

function safeSnapshot(value: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!value) return null;
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value).slice(0, 30)) {
    if (SENSITIVE_KEY.test(key)) { output[key] = '[redacted]'; continue; }
    if (item === null || SAFE_VALUE.test(typeof item)) output[key] = typeof item === 'string' ? item.slice(0, 300) : item;
    else if (Array.isArray(item) && item.length <= 30 && item.every((entry) => entry === null || SAFE_VALUE.test(typeof entry))) output[key] = item.map((entry) => typeof entry === 'string' ? entry.slice(0, 120) : entry);
    else output[key] = '[omitted]';
  }
  return output;
}

export async function writeAuditEvent(event: AuditEventInput): Promise<void> {
  const action = event.action.trim().slice(0, 120);
  const entityType = event.entityType.trim().slice(0, 100);
  if (!action || !entityType) throw new Error('Audit action and entity type are required.');
  const { db } = await import('@/lib/db');
  await db.insert(auditLogs).values({
    actorType: 'admin',
    actorId: 'admin-session',
    action,
    entityType,
    entityId: event.entityId == null ? null : String(event.entityId).slice(0, 160),
    before: safeSnapshot(event.before),
    after: safeSnapshot(event.after),
    requestId: event.requestId?.slice(0, 160) || null,
    ipAddress: null,
  });
}
