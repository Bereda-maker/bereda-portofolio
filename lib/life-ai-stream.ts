export type LifeAiStreamEvent = {
  type: string;
  content?: string;
  conversationId?: number;
  message?: string;
  block?: unknown;
};

function parseFrames(buffer: string, flush: boolean): { events: LifeAiStreamEvent[]; remainder: string } {
  const frames = buffer.split(/\r?\n\r?\n/);
  const remainder = flush ? '' : frames.pop() ?? '';
  const events: LifeAiStreamEvent[] = [];
  for (const frame of frames) {
    const data = frame.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trimStart()).join('\n');
    if (!data) continue;
    try {
      const value = JSON.parse(data) as unknown;
      if (value && typeof value === 'object' && 'type' in value && typeof (value as { type?: unknown }).type === 'string') events.push(value as LifeAiStreamEvent);
    } catch { /* Ignore malformed or incomplete server frames; the next frame remains independent. */ }
  }
  return { events, remainder };
}

export async function* readLifeAiStream(stream: ReadableStream<Uint8Array>): AsyncGenerator<LifeAiStreamEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parsed = parseFrames(buffer, false);
      buffer = parsed.remainder;
      for (const event of parsed.events) yield event;
    }
    buffer += decoder.decode();
    const parsed = parseFrames(buffer, true);
    for (const event of parsed.events) yield event;
  } finally {
    reader.releaseLock();
  }
}
