import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminRequest } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { aiProvider } from '@/lib/services/providers';
import { PROFILE_CATEGORIES, PROFILE_CATEGORY_INFO } from '@/lib/life-ai-profile-contract';
import { getMissingProfileCategoryLabels } from '@/lib/life-ai-profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const DraftInput = z.object({
  category: z.enum(PROFILE_CATEGORIES),
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(2_000) })).min(1).max(8),
});
const requests = new Map<string, number[]>();
function isRateLimited() {
  const now = Date.now();
  const recent = (requests.get('admin') ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= 8) return true;
  recent.push(now);
  requests.set('admin', recent);
  return false;
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const parsed = DraftInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== 'user') return NextResponse.json({ error: 'Send a profile question to continue.' }, { status: 400 });
  if (isRateLimited()) return NextResponse.json({ error: 'Please wait before asking for another profile draft.' }, { status: 429 });

  const category = PROFILE_CATEGORY_INFO[parsed.data.category];
  const totalCharacters = parsed.data.messages.reduce((sum, message) => sum + message.content.length, 0);
  if (totalCharacters > 8_000) return NextResponse.json({ error: 'This draft conversation is too long. Start a new one.' }, { status: 400 });
  let missingCategories: string[];
  try { missingCategories = await getMissingProfileCategoryLabels(); }
  catch { return NextResponse.json({ error: 'Profile status is temporarily unavailable, so draft assistance cannot continue.' }, { status: 503 }); }

  const result = await aiProvider.chat({
    system: `You are Your Life AI, helping the owner think through a draft for the profile section “${category.label}”. Ask concise, respectful follow-up questions when useful. Suggest wording only from details the owner explicitly shared in this conversation. Never invent personal facts, assume beliefs, diagnose, or treat this draft as saved information. You may offer clearly labeled, optional generic goal or priority ideas when asked, but do not represent them as the owner's own goals. If asked what profile areas still need information, only these section names currently appear empty: ${missingCategories.length ? missingCategories.join(', ') : 'none'}. Make clear your answer is only a suggestion for the owner to review and copy; it does not update their profile. The section may contain sensitive information: do not pressure the owner to disclose it. Only section-name metadata is provided; do not claim access to other saved profile details.`,
    messages: parsed.data.messages,
  });
  if (result.status !== 'ok') return NextResponse.json({ error: 'Your Life AI could not prepare a draft just now. Try again later.' }, { status: 503 });
  return NextResponse.json({ draft: result.data.text.slice(0, 8_000) }, { headers: { 'cache-control': 'no-store, private' } });
}
