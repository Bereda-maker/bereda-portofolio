'use client';

import { useEffect, useState } from 'react';
import { Check, Clipboard, ExternalLink, Loader2, Search, ShieldCheck, Sparkles, Target, Trash2, UserRound } from 'lucide-react';
import { OPPORTUNITY_SOURCES, VERIFIED_AUTOMATED_SOURCES } from '@/lib/services/opportunity-sources';

type Profile = { id: number; name: string; headline: string | null; skills: string[]; yearsExperience: number | null; workMode: string | null; locations: string[]; portfolioUrl: string | null; githubUrl: string | null; projectsSummary: string | null; preferences: string | null } | null;
type Opportunity = { id: number; title: string; description: string | null; location: string | null; workMode: string | null; employmentType: string | null; requiredSkills: string[]; minYearsExperience: number | null; matches: Array<{ id: number; profileId: number; score: number; reasoning: string | null; matchedSkills: string[]; gaps: string[]; status: string }>; evidence: Array<{ sourceUrl: string; sourceTitle: string | null; publisher: string | null; excerpt: string | null }>; drafts: Array<{ id: number; channel: string; subject: string | null; body: string; status: string }> };
type DiscoveryCategory = 'remote' | 'freelance' | 'internship' | 'cofounder';
type DiscoveryRecommendation = { id: string; sourceId: string; sourceName: string; category: 'remote' | 'freelance' | 'internship'; title: string; company: string; description: string; location: string; tags: string[]; sourceUrl: string; applyUrl: string; publishedAt: string; fitScore: number; whyFit: string; risks: string[]; requiredSkills: string[]; employmentType: string };
type CofounderDirection = { title: string; startupAngle: string; idealPartner: string; whyFit: string; nextStep: string };
type DiscoveryResponse = { recommendations: DiscoveryRecommendation[]; cofounderDirections: CofounderDirection[]; searchedSources: string[]; sourceWarnings: string[] };

const inputClass = 'fld';
const emptyProfile = { name: '', headline: '', skills: '', yearsExperience: '', workMode: '', locations: '', portfolioUrl: '', githubUrl: '', projectsSummary: '', preferences: '' };
const discoveryCategories: Array<{ id: DiscoveryCategory; label: string }> = [
  { id: 'remote', label: 'Remote roles' },
  { id: 'freelance', label: 'Freelance / contract projects' },
  { id: 'internship', label: 'Remote internships' },
  { id: 'cofounder', label: 'Startup co-founder directions' },
];
const sourceGroups = [...new Set(OPPORTUNITY_SOURCES.map((source) => source.group))];

function SourceDirectory() {
  return <details className="rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-inset)] p-4 sm:p-5">
    <summary className="cursor-pointer text-sm font-semibold">Browse all {OPPORTUNITY_SOURCES.length} platforms ({VERIFIED_AUTOMATED_SOURCES.length} verified live feeds)</summary>
    <p className="mt-3 max-w-4xl text-sm leading-relaxed opacity-65">The AI automatically searches only the sources with verified public feeds/APIs. Other platforms are direct browse links because they lack a suitable public feed, restrict automated collection, or require membership.</p>
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      {sourceGroups.map((group) => <section key={group}>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest opacity-55">{group}</h3>
        <ul className="flex flex-col gap-2">
          {OPPORTUNITY_SOURCES.filter((source) => source.group === group).map((source) => <li key={source.id} className="flex items-start justify-between gap-3 rounded-xl border border-[color:var(--admin-border)] px-3 py-2.5">
            <div className="min-w-0"><a className="text-sm font-medium hover:underline" href={source.url} target="_blank" rel="noreferrer">{source.name} <ExternalLink className="inline" size={12} /></a><p className="mt-1 text-xs leading-relaxed opacity-55">{source.note}</p></div>
            <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${source.access === 'verified_feed' ? 'admin-tint-bg admin-tint-text' : source.access === 'member_only' ? 'admin-gold-bg admin-gold-text' : 'bg-[color:var(--admin-inset)] opacity-70'}`}>{source.access === 'verified_feed' ? 'Live feed' : source.access === 'member_only' ? 'Member-only' : 'Browse'}</span>
          </li>)}
        </ul>
      </section>)}
    </div>
  </details>;
}

export default function OpportunitiesWorkspace({ initialProfile, initialOpportunities }: { initialProfile: Profile; initialOpportunities: Opportunity[] }) {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [profileForm, setProfileForm] = useState(initialProfile ? { name: initialProfile.name, headline: initialProfile.headline ?? '', skills: initialProfile.skills.join(', '), yearsExperience: initialProfile.yearsExperience?.toString() ?? '', workMode: initialProfile.workMode ?? '', locations: initialProfile.locations.join(', '), portfolioUrl: initialProfile.portfolioUrl ?? '', githubUrl: initialProfile.githubUrl ?? '', projectsSummary: initialProfile.projectsSummary ?? '', preferences: initialProfile.preferences ?? '' } : emptyProfile);
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [sourceUrl, setSourceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [categories, setCategories] = useState<DiscoveryCategory[]>(['remote', 'freelance', 'internship', 'cofounder']);
  const [discovery, setDiscovery] = useState<DiscoveryResponse | null>(null);
  const [channel, setChannel] = useState('email');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [tracker, setTracker] = useState({ day: '', target: 5, applied: 0 });
  const [goalDraft, setGoalDraft] = useState('5');
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const refresh = async () => { const refreshed = await fetch('/api/admin/opportunities').then((response) => response.json()); setOpportunities(refreshed.opportunities ?? []); };
  useEffect(() => { const day = today(); fetch(`/api/admin/opportunities/tracker?day=${day}`).then((response) => response.json()).then((data) => { setTracker(data); setGoalDraft(String(data.target ?? 5)); }).catch(() => undefined); }, []);
  const trackerUpdate = async (actionName: 'set_goal' | 'log_application', target?: number) => { const response = await fetch('/api/admin/opportunities/tracker', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ day: tracker.day || today(), action: actionName, ...(target === undefined ? {} : { target }) }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? 'Tracker update failed.'); setTracker(data); setGoalDraft(String(data.target)); };
  const deleteOpportunity = async (id: number) => { if (!window.confirm('Delete this saved opportunity and its AI drafts and application records? This cannot be undone.')) return; setBusy(`delete-${id}`); try { const response = await fetch(`/api/admin/opportunities/${id}`, { method: 'DELETE' }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? 'Delete failed.'); await refresh(); setMessage('Opportunity and its saved drafts were deleted.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Delete failed.'); } finally { setBusy(''); } };
  const deleteDraft = async (opportunityId: number, draftId: number) => { if (!window.confirm('Delete this saved AI draft?')) return; setBusy(`delete-draft-${draftId}`); try { await request(`/api/admin/opportunities/${opportunityId}`, { action: 'delete_draft', draftId }); await refresh(); setMessage('Draft deleted.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not delete draft.'); } finally { setBusy(''); } };
  const copyDraft = async (text: string) => { try { await navigator.clipboard.writeText(text); setMessage('Draft copied to clipboard.'); } catch { setMessage('Could not access clipboard; select and copy the draft text.'); } };

  const update = (key: string, value: string) => setProfileForm((current) => ({ ...current, [key]: value }));
  const request = async (url: string, body: unknown) => { const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error ?? 'Request failed.'); return data; };
  const saveProfile = async () => {
    setBusy('profile'); setMessage('');
    try {
      const response = await fetch('/api/admin/profile', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...profileForm, skills: profileForm.skills.split(',').map((v) => v.trim()).filter(Boolean), locations: profileForm.locations.split(',').map((v) => v.trim()).filter(Boolean), yearsExperience: profileForm.yearsExperience ? Number(profileForm.yearsExperience) : null }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not save profile.');
      setProfile(data.profile); setMessage('Profile saved.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save profile.'); } finally { setBusy(''); }
  };
  const runResearch = async () => {
    if (!sourceUrl) return setMessage('Add a public job, company, freelance, or recruiting URL first.');
    setBusy('research'); setMessage('');
    try {
      const data = await request('/api/admin/opportunities', { sourceUrl, notes, profileId: profile?.id });
      await refresh(); setSourceUrl(''); setNotes(''); setMessage(`Added “${data.opportunity.title}” with evidence${data.match ? ' and a fit score' : ''}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Research failed.'); } finally { setBusy(''); }
  };
  const runDiscovery = async () => {
    if (!profile?.id) return setMessage('Save your candidate profile before discovering recommendations.');
    if (!categories.length) return setMessage('Choose at least one recommendation category.');
    setBusy('discovery'); setMessage('');
    try {
      const data = await request('/api/admin/opportunities', { action: 'discover', profileId: profile.id, categories }) as DiscoveryResponse;
      setDiscovery(data);
      setMessage(`Found ${data.recommendations.length} listing recommendation${data.recommendations.length === 1 ? '' : 's'} from ${data.searchedSources.length} live source${data.searchedSources.length === 1 ? '' : 's'}, plus ${data.cofounderDirections.length} co-founder direction${data.cofounderDirections.length === 1 ? '' : 's'}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Discovery failed.'); } finally { setBusy(''); }
  };
  const action = async (id: number, actionName: string, extra: Record<string, unknown> = {}) => {
    if (!profile?.id) return setMessage('Save your candidate profile before running matching or drafting.');
    setBusy(`${actionName}-${id}`); setMessage('');
    try { await request(`/api/admin/opportunities/${id}`, { action: actionName, profileId: profile.id, ...extra }); await refresh(); setMessage(actionName === 'draft_outreach' ? 'Draft prepared. Nothing was sent.' : 'Opportunity updated.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Action failed.'); } finally { setBusy(''); }
  };
  const saveRecommendation = async (item: DiscoveryRecommendation) => {
    if (!profile?.id) return setMessage('Save your profile before adding a recommendation.');
    setBusy(`save-${item.id}`); setMessage('');
    try {
      const saved = await request('/api/admin/opportunities', { title: item.title, company: item.company, description: item.description.slice(0, 5000), location: item.location.slice(0, 160), workMode: 'Remote', employmentType: item.employmentType, requiredSkills: item.requiredSkills.slice(0, 50), minYearsExperience: null, sourceUrl: item.sourceUrl, sourceName: item.sourceName });
      await request(`/api/admin/opportunities/${saved.opportunity.id}`, { action: 'match', profileId: profile.id });
      await refresh();
      setDiscovery((current) => current ? { ...current, recommendations: current.recommendations.filter((recommendation) => recommendation.id !== item.id) } : current);
      setMessage(`Saved “${item.title}” with a profile fit score. Review the source before acting.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save recommendation.'); } finally { setBusy(''); }
  };
  const toggleCategory = (category: DiscoveryCategory) => setCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);

  return <div className="flex flex-col gap-8">
    <header className="admin-page-header"><div><p className="admin-eyebrow">AI Workspace / Research</p><h1 className="admin-title">Opportunities</h1><p className="admin-description">Research smarter. Match better. Apply with purpose. AI prepares evidence-backed recommendations while every application and message stays under your approval.</p></div><div className="admin-notice max-w-sm"><div className="flex gap-3"><ShieldCheck size={20} /><span className="text-sm leading-relaxed">Human approval is required before anything can be submitted or sent.</span></div></div></header>
    {message && <div className="admin-notice text-sm">{message}</div>}

    <section className="admin-card overflow-hidden p-5 sm:p-7">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3"><span className="rounded-2xl admin-tint-bg p-3 admin-tint-text"><Target size={22} /></span><div><p className="admin-eyebrow">Daily momentum</p><h2 className="text-xl font-bold">Application goal</h2><p className="mt-1 text-sm opacity-65">Track real applications you submit today—not drafts you prepare.</p></div></div>
        <div className="flex flex-wrap items-end gap-2"><label className="admin-labelled"><span>Daily target</span><input className={inputClass} type="number" min="1" max="100" value={goalDraft} onChange={(event) => setGoalDraft(event.target.value)} /></label><button className="admin-button-secondary" onClick={() => trackerUpdate('set_goal', Number(goalDraft)).then(() => setMessage('Daily goal updated.')).catch((error) => setMessage(error.message))}>Set goal</button><button className="admin-button" onClick={() => trackerUpdate('log_application').then(() => setMessage('Application logged for today.')).catch((error) => setMessage(error.message))}><Check size={15} /> Log application</button></div>
      </div>
      <div className="mt-6"><div className="mb-2 flex items-end justify-between"><p className="text-3xl font-bold">{tracker.applied}<span className="ml-2 text-base font-medium opacity-50">/ {tracker.target} today</span></p><p className="text-sm font-semibold admin-tint-text">{tracker.target ? Math.min(100, Math.round(tracker.applied / tracker.target * 100)) : 0}%</p></div><div className="h-3 overflow-hidden rounded-full bg-[color:var(--admin-inset)]"><div className="h-full rounded-full admin-tint-bg transition-all" style={{ width: `${tracker.target ? Math.min(100, tracker.applied / tracker.target * 100) : 0}%` }} /></div><p className="mt-2 text-xs opacity-55">{tracker.applied >= tracker.target ? 'Goal reached—great work showing up consistently.' : `${Math.max(0, tracker.target - tracker.applied)} more ${tracker.target - tracker.applied === 1 ? 'application' : 'applications'} to hit today’s goal.`} Counts reset by day; set a new target any time.</p></div>
    </section>

    <section className="admin-card p-5 sm:p-7">
      <div className="mb-5 flex items-center gap-3"><UserRound size={20} /><div><h2 className="text-xl font-bold">Your candidate profile</h2><p className="text-sm opacity-60">This is the evidence base used for every fit score and draft.</p></div></div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="admin-labelled"><span>Name</span><input className={inputClass} placeholder="Name" value={profileForm.name} onChange={(event) => update('name', event.target.value)} /></label>
        <label className="admin-labelled"><span>Headline</span><input className={inputClass} placeholder="Headline, e.g. Full-stack TypeScript developer" value={profileForm.headline} onChange={(event) => update('headline', event.target.value)} /></label>
        <label className="admin-labelled"><span>Skills</span><input className={inputClass} placeholder="Skills, comma separated" value={profileForm.skills} onChange={(event) => update('skills', event.target.value)} /></label>
        <label className="admin-labelled"><span>Years of experience</span><input className={inputClass} type="number" placeholder="Years of experience" value={profileForm.yearsExperience} onChange={(event) => update('yearsExperience', event.target.value)} /></label>
        <label className="admin-labelled"><span>Preferred work mode</span><input className={inputClass} placeholder="Preferred work mode" value={profileForm.workMode} onChange={(event) => update('workMode', event.target.value)} /></label>
        <label className="admin-labelled"><span>Locations</span><input className={inputClass} placeholder="Locations, comma separated" value={profileForm.locations} onChange={(event) => update('locations', event.target.value)} /></label>
        <label className="admin-labelled"><span>Portfolio URL</span><input className={inputClass} placeholder="Portfolio URL" value={profileForm.portfolioUrl} onChange={(event) => update('portfolioUrl', event.target.value)} /></label>
        <label className="admin-labelled"><span>GitHub URL</span><input className={inputClass} placeholder="GitHub URL" value={profileForm.githubUrl} onChange={(event) => update('githubUrl', event.target.value)} /></label>
        <label className="admin-labelled md:col-span-2"><span>Projects and proof</span><textarea className={`${inputClass} min-h-24`} placeholder="Projects and proof: products built, contributions, outcomes, domains" value={profileForm.projectsSummary} onChange={(event) => update('projectsSummary', event.target.value)} /></label>
        <label className="admin-labelled md:col-span-2"><span>Preferences and boundaries</span><textarea className={`${inputClass} min-h-20`} placeholder="Preferences and boundaries: markets, salary/rates, industries, deal-breakers" value={profileForm.preferences} onChange={(event) => update('preferences', event.target.value)} /></label>
      </div>
      <button className="admin-button mt-5" onClick={saveProfile} disabled={busy === 'profile'}>{busy === 'profile' ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Save profile</button>
    </section>

    <section className="admin-card p-5 sm:p-7">
      <div className="mb-5 flex items-center gap-3"><Sparkles size={20} /><div><h2 className="text-xl font-bold">Discover from my profile</h2><p className="text-sm opacity-60">AI ranks remote, freelance/contract, and internship listings from verified public feeds against your profile.</p></div></div>
      <div className="mb-5 flex flex-wrap gap-3">{discoveryCategories.map((category) => <label key={category.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[color:var(--admin-border)] px-3 py-2 text-sm"><input type="checkbox" checked={categories.includes(category.id)} onChange={() => toggleCategory(category.id)} />{category.label}</label>)}</div>
      <button className="admin-button" onClick={runDiscovery} disabled={busy === 'discovery' || !profile?.id}>{busy === 'discovery' ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />} Find recommendations</button>
      {discovery && <div className="mt-6 flex flex-col gap-5">
        <p className="text-xs opacity-55">Searched live feeds: {discovery.searchedSources.join(', ') || 'none selected'}.</p>
        {discovery.sourceWarnings.map((warning) => <p key={warning} className="rounded-xl admin-gold-border p-3 text-sm admin-gold-text">{warning}</p>)}
        {categories.some((category) => category !== 'cofounder') && discovery.recommendations.length === 0 && <p className="rounded-xl border border-[color:var(--admin-border)] p-4 text-sm opacity-70">No strong matches came from the verified live feeds for the selected categories. Browse the relevant platforms in the source directory below.</p>}
        {discovery.recommendations.map((item) => <article key={item.id} className="rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-inset)] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full admin-tint-bg px-3 py-1 text-xs font-bold admin-tint-text">{item.category === 'freelance' ? 'Freelance / contract' : item.category === 'internship' ? 'Internship' : 'Remote role'}</span><span className="text-xs opacity-60">{item.fitScore}% AI fit</span></div><h3 className="mt-2 text-lg font-bold">{item.title}</h3><p className="text-sm opacity-70">{item.company || item.sourceName}{item.location ? ` · ${item.location}` : ''}{item.publishedAt ? ` · ${new Date(item.publishedAt).toLocaleDateString()}` : ''}</p></div>
            <div className="flex shrink-0 flex-wrap gap-2"><a className="admin-button-secondary" href={item.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> {item.sourceName} listing</a>{item.applyUrl && item.applyUrl !== item.sourceUrl && <a className="admin-button-secondary" href={item.applyUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Apply at source</a>}<button className="admin-button" onClick={() => saveRecommendation(item)} disabled={busy === `save-${item.id}`}>{busy === `save-${item.id}` ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Save & score</button></div>
          </div>
          <p className="mt-3 text-sm leading-relaxed opacity-80">{item.whyFit}</p><p className="mt-2 text-sm leading-relaxed opacity-65">{item.description.slice(0, 700)}{item.description.length > 700 ? '…' : ''}</p>
          {item.tags.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{item.tags.slice(0, 8).map((tag) => <span key={tag} className="rounded-full border border-[color:var(--admin-border)] px-2.5 py-1 text-xs opacity-75">{tag}</span>)}</div>}
          {item.risks.length > 0 && <p className="mt-3 text-xs admin-gold-text">Check: {item.risks.join(' · ')}</p>}
        </article>)}
        {discovery.cofounderDirections.map((direction, index) => <article key={`${direction.title}-${index}`} className="rounded-2xl admin-gold-border bg-[color:var(--admin-inset)] p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><span className="rounded-full admin-gold-bg px-3 py-1 text-xs font-bold admin-gold-text">AI-generated direction · not a live listing</span><h3 className="mt-2 text-lg font-bold">{direction.title}</h3></div><a className="admin-button-secondary shrink-0" href="https://www.ycombinator.com/cofounder-matching" target="_blank" rel="noreferrer">Explore co-founder matching <ExternalLink size={14} /></a></div><p className="mt-3 text-sm leading-relaxed"><strong>Startup angle:</strong> {direction.startupAngle}</p><p className="mt-2 text-sm leading-relaxed"><strong>Complementary partner:</strong> {direction.idealPartner}</p><p className="mt-2 text-sm leading-relaxed opacity-75"><strong>Why it fits:</strong> {direction.whyFit}</p><p className="mt-2 text-sm leading-relaxed opacity-75"><strong>Next step:</strong> {direction.nextStep}</p><p className="mt-3 text-xs opacity-50">Co-founder profiles may be private; this is a profile-based strategy suggestion, not a recommendation of a specific person.</p></article>)}
      </div>}
      <div className="mt-6"><SourceDirectory /></div>
    </section>

    <section className="admin-card p-5 sm:p-7"><div className="mb-5 flex items-center gap-3"><Search size={20} /><div><h2 className="text-xl font-bold">Research an opportunity</h2><p className="text-sm opacity-60">Paste a public job, company, freelance brief, or recruiting page. The agent extracts only what the source supports.</p></div></div><div className="grid gap-4 md:grid-cols-[1fr_auto]"><label className="admin-labelled"><span>Opportunity URL</span><input className={inputClass} type="url" placeholder="https://example.com/careers/role" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} /></label><button className="admin-button" onClick={runResearch} disabled={busy === 'research'}>{busy === 'research' ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} Research and score</button></div><label className="admin-labelled"><span>Context <em>optional</em></span><textarea className={`${inputClass} mt-4 min-h-20`} placeholder="Optional context: why this lead matters or what to look for" value={notes} onChange={(event) => setNotes(event.target.value)} /></label></section>

    <section><div className="mb-4 flex items-end justify-between"><div><p className="admin-eyebrow">Evidence queue</p><h2 className="text-2xl font-bold">Prioritized opportunities</h2></div><span className="text-sm opacity-60">{opportunities.length} saved</span></div><div className="flex flex-col gap-4">{opportunities.map((opportunity) => { const match = opportunity.matches[0]; const draft = opportunity.drafts[0]; return <article key={opportunity.id} className="admin-card p-5 sm:p-7"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-bold">{opportunity.title}</h3>{match && <span className="rounded-full admin-tint-bg px-3 py-1 text-xs font-bold admin-tint-text">{match.score}% fit</span>}</div><p className="mt-2 max-w-3xl text-sm leading-relaxed opacity-75">{opportunity.description}</p><div className="mt-3 flex flex-wrap gap-2">{opportunity.requiredSkills.map((skill) => <span key={skill} className="rounded-full border border-[color:var(--admin-border)] px-2.5 py-1 text-xs opacity-75">{skill}</span>)}</div></div><div className="flex shrink-0 flex-wrap gap-2"><button className="admin-button-secondary" onClick={() => deleteOpportunity(opportunity.id)} disabled={busy === `delete-${opportunity.id}`}><Trash2 size={14} /> Delete</button>{opportunity.evidence[0] && <a className="admin-button-secondary" href={opportunity.evidence[0].sourceUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> {opportunity.evidence[0].publisher ? `${opportunity.evidence[0].publisher} listing` : 'Source'}</a>}{!match && <button className="admin-button" onClick={() => action(opportunity.id, 'match')} disabled={busy === `match-${opportunity.id}`}>{busy === `match-${opportunity.id}` ? <Loader2 className="animate-spin" size={14} /> : 'Score fit'}</button>}</div></div>{match && <div className="mt-5 grid gap-4 border-t border-[color:var(--admin-border)] pt-5 md:grid-cols-3"><div><p className="text-xs uppercase tracking-widest opacity-50">Why it fits</p><p className="mt-2 text-sm opacity-80">{match.reasoning}</p></div><div><p className="text-xs uppercase tracking-widest opacity-50">Matched skills</p><p className="mt-2 text-sm opacity-80">{match.matchedSkills.join(', ') || 'None recorded'}</p></div><div><p className="text-xs uppercase tracking-widest opacity-50">Gaps to review</p><p className="mt-2 text-sm opacity-80">{match.gaps.join(', ') || 'No obvious gaps'}</p></div></div>}{opportunity.drafts.length > 0 && <div className="mt-5 flex flex-col gap-3 border-t border-[color:var(--admin-border)] pt-5"><div><p className="admin-eyebrow">Ready for your review</p><p className="text-sm opacity-60">Profile-based drafts are saved here. Nothing is sent automatically.</p></div>{opportunity.drafts.map((savedDraft) => <div key={savedDraft.id} className="rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-inset)] p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><span className="rounded-full admin-tint-bg px-2.5 py-1 text-xs font-bold uppercase admin-tint-text">{savedDraft.channel === 'linkedin' ? 'LinkedIn message' : savedDraft.channel === 'application' ? 'Cover letter' : 'Email'}</span><span className="ml-2 text-xs opacity-50">Draft · not sent</span>{savedDraft.subject && <h4 className="mt-3 text-sm font-bold">Subject: {savedDraft.subject}</h4>}</div><div className="flex gap-2"><button className="admin-button-secondary" onClick={() => copyDraft(`${savedDraft.subject ? `Subject: ${savedDraft.subject}\n\n` : ''}${savedDraft.body}`)}><Clipboard size={14} /> Copy</button><button className="admin-button-secondary" onClick={() => deleteDraft(opportunity.id, savedDraft.id)} disabled={busy === `delete-draft-${savedDraft.id}`} aria-label="Delete draft"><Trash2 size={14} /> Delete</button></div></div><p className="mt-3 whitespace-pre-wrap text-sm leading-7">{savedDraft.body}</p></div>)}</div>}<div className="mt-5 flex flex-wrap gap-2 border-t border-[color:var(--admin-border)] pt-4">{match?.status === 'pending' && <><button className="admin-button" onClick={() => action(opportunity.id, 'approve_match')}><Check size={14} /> Approve match</button><button className="admin-button-secondary" onClick={() => action(opportunity.id, 'reject_match')}>Reject</button></>}{match && <><select className="admin-select text-xs" value={channel} onChange={(event) => setChannel(event.target.value)}><option value="email">Email draft</option><option value="linkedin">LinkedIn draft</option><option value="application">Application draft</option></select><button className="admin-button-secondary" onClick={() => action(opportunity.id, 'draft_outreach', { channel })} disabled={busy === `draft_outreach-${opportunity.id}`}>{busy === `draft_outreach-${opportunity.id}` ? <Loader2 className="animate-spin" size={14} /> : 'Prepare draft'}</button></>}</div></article> })}{opportunities.length === 0 && <div className="admin-card border-dashed p-8 text-sm opacity-60">No opportunities yet. Save your profile, then paste a public source above.</div>}</div></section>
  </div>;
}
