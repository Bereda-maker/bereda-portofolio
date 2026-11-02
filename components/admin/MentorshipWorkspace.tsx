'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Check, Clock3, GraduationCap, Plus, Save, UserRound } from 'lucide-react';

type Profile = { id: number; name: string; email: string | null; bio: string | null; specialties: string[]; timezone: string; defaultRateCentsPerMinute: number; isActive: boolean };
type Session = { id: number; profileId: number; menteeEmail: string; status: string; startsAt: string; endsAt: string | null; plannedMinutes: number; actualMinutes: number | null; rateCentsPerMinute: number; totalCents: number; externalReference: string | null; notes: string | null };
type Balance = { profileId: number; mentorName: string; menteeEmail: string; grantedMinutes: number; usedMinutes: number; remainingMinutes: number; recordedCents: number };
type Ledger = { id: number; profileId: number; sessionId: number | null; menteeEmail: string; minutes: number; amountCents: number; entryType: string; metadata: Record<string, unknown>; createdAt: string };
type Data = { profiles: Profile[]; sessions: Session[]; balances: Balance[]; ledger: Ledger[] };

type MentorForm = { name: string; email: string; bio: string; specialties: string; timezone: string; rate: string; isActive: boolean };
const blankMentor: MentorForm = { name: '', email: '', bio: '', specialties: '', timezone: 'UTC', rate: '0', isActive: true };

function localDateTimeValue() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
function formatDate(value: string) { return new Date(value).toLocaleString(); }
function minutesLabel(value: number) { return `${Math.floor(value / 60)}h ${value % 60}m`; }
function centsLabel(value: number) { return `${value.toLocaleString()} cents`; }

export default function MentorshipWorkspace() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [mentorForm, setMentorForm] = useState<MentorForm>(blankMentor);
  const [sessionForm, setSessionForm] = useState({ profileId: '', menteeEmail: '', startsAt: '', plannedMinutes: '60', notes: '', externalReference: '' });
  const [grantForm, setGrantForm] = useState({ profileId: '', menteeEmail: '', minutes: '60', note: '' });
  const [actualMinutes, setActualMinutes] = useState<Record<number, string>>({});

  async function load() {
    try {
      const response = await fetch('/api/admin/mentorship', { cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not load mentorship data.');
      setData(result as Data);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load mentorship data.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    setSessionForm((current) => ({ ...current, startsAt: current.startsAt || localDateTimeValue() }));
    setMentorForm((current) => current.timezone === 'UTC' ? { ...current, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } : current);
  }, []);

  async function submit(payload: Record<string, unknown>, success: string) {
    setBusy(String(payload.action || 'saving'));
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/mentorship', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not save mentorship changes.');
      await load();
      setNotice(success);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save mentorship changes.');
      return false;
    } finally {
      setBusy('');
    }
  }

  async function saveMentor(event: FormEvent) {
    event.preventDefault();
    const saved = await submit({
      action: 'save_profile', id: editingId || undefined, name: mentorForm.name, email: mentorForm.email,
      bio: mentorForm.bio, specialties: mentorForm.specialties.split(',').map((item) => item.trim()).filter(Boolean),
      timezone: mentorForm.timezone, defaultRateCentsPerMinute: Number(mentorForm.rate), isActive: mentorForm.isActive,
    }, editingId ? 'Mentor profile updated.' : 'Mentor profile created.');
    if (saved) { setEditingId(null); setMentorForm({ ...blankMentor, timezone: mentorForm.timezone }); }
  }
  function editMentor(profile: Profile) {
    setEditingId(profile.id);
    setMentorForm({ name: profile.name, email: profile.email || '', bio: profile.bio || '', specialties: profile.specialties.join(', '), timezone: profile.timezone, rate: String(profile.defaultRateCentsPerMinute), isActive: profile.isActive });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function createSession(event: FormEvent) {
    event.preventDefault();
    const profileId = Number(sessionForm.profileId || data?.profiles.find((profile) => profile.isActive)?.id);
    const saved = await submit({ ...sessionForm, action: 'create_session', profileId, startsAt: new Date(sessionForm.startsAt).toISOString(), plannedMinutes: Number(sessionForm.plannedMinutes) }, 'Session scheduled in the mentorship ledger.');
    if (saved) setSessionForm((current) => ({ ...current, menteeEmail: '', startsAt: localDateTimeValue(), notes: '', externalReference: '' }));
  }
  async function grantAllowance(event: FormEvent) {
    event.preventDefault();
    const profileId = Number(grantForm.profileId || data?.profiles.find((profile) => profile.isActive)?.id);
    const saved = await submit({ ...grantForm, action: 'grant_allowance', profileId, minutes: Number(grantForm.minutes) }, 'Free-minute grant added to the student ledger.');
    if (saved) setGrantForm((current) => ({ ...current, menteeEmail: '', note: '' }));
  }
  const activeProfiles = data?.profiles.filter((profile) => profile.isActive) || [];
  const upcoming = data?.sessions.filter((session) => session.status === 'scheduled' && new Date(session.startsAt).getTime() >= Date.now()).length || 0;
  const completed = data?.sessions.filter((session) => session.status === 'completed') || [];
  const totalMinutes = completed.reduce((sum, session) => sum + (session.actualMinutes || 0), 0);
  const totalCents = completed.reduce((sum, session) => sum + session.totalCents, 0);

  if (loading) return <div className="admin-card p-6 text-sm text-[color:var(--admin-muted)]">Loading mentorship workspace…</div>;
  if (!data) return <div className="grid gap-4">{error && <div className="admin-error">{error}</div>}<button className="admin-button w-fit" onClick={() => { setLoading(true); void load(); }}>Retry</button></div>;

  return <div className="grid gap-6">
    {error && <div className="admin-error">{error}</div>}
    {notice && <div className="admin-notice text-sm">{notice}</div>}

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        ['Active mentors', String(activeProfiles.length)],
        ['Upcoming sessions', String(upcoming)],
        ['Completed time', minutesLabel(totalMinutes)],
        ['Recorded amount', centsLabel(totalCents)],
      ].map(([label, value]) => <div key={label} className="admin-card p-4"><p className="admin-eyebrow">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>)}
    </div>

    <div className="admin-notice text-sm">This workspace tracks mentorship records only. Public booking requests and Google Calendar availability remain in Appointments. Amounts are stored as integer cents; currency and payment collection are not configured here, and this ledger never charges a payment method.</div>

    <section className="admin-card p-5 sm:p-6">
      <div className="admin-section-heading"><UserRound size={18} /> {editingId ? 'Edit mentor profile' : 'Mentor profile'}</div>
      <p className="mb-4 text-sm text-[color:var(--admin-muted)]">A profile holds the mentor’s specialties, timezone, and default rate. Rates are stored as cents per minute and copied to each new session.</p>
      <form onSubmit={saveMentor} className="grid gap-3 md:grid-cols-2">
        <input className="fld" required maxLength={140} placeholder="Mentor name" value={mentorForm.name} onChange={(event) => setMentorForm({ ...mentorForm, name: event.target.value })} />
        <input className="fld" type="email" maxLength={200} placeholder="Mentor email (optional)" value={mentorForm.email} onChange={(event) => setMentorForm({ ...mentorForm, email: event.target.value })} />
        <input className="fld" maxLength={80} required placeholder="Timezone, e.g. Africa/Addis_Ababa" value={mentorForm.timezone} onChange={(event) => setMentorForm({ ...mentorForm, timezone: event.target.value })} />
        <input className="fld" type="number" min="0" max="1000000" step="1" required aria-label="Rate in cents per minute" placeholder="Rate (cents per minute)" value={mentorForm.rate} onChange={(event) => setMentorForm({ ...mentorForm, rate: event.target.value })} />
        <input className="fld md:col-span-2" placeholder="Specialties, comma separated" value={mentorForm.specialties} onChange={(event) => setMentorForm({ ...mentorForm, specialties: event.target.value })} />
        <textarea className="fld min-h-24 md:col-span-2" maxLength={4000} placeholder="Mentor bio or program notes" value={mentorForm.bio} onChange={(event) => setMentorForm({ ...mentorForm, bio: event.target.value })} />
        <label className="flex items-center gap-2 text-sm text-[color:var(--admin-muted)]"><input type="checkbox" checked={mentorForm.isActive} onChange={(event) => setMentorForm({ ...mentorForm, isActive: event.target.checked })} /> Active and available for new mentorship records</label>
        <div className="flex flex-wrap gap-2"><button className="admin-button" disabled={busy === 'save_profile'}>{busy === 'save_profile' ? 'Saving…' : editingId ? <><Save size={15} /> Save profile</> : <><Plus size={15} /> Add mentor</>}</button>{editingId && <button type="button" className="admin-button-secondary" onClick={() => { setEditingId(null); setMentorForm(blankMentor); }}>Cancel edit</button>}</div>
      </form>
      <div className="mt-5 grid gap-2">{data.profiles.map((profile) => <div key={profile.id} className="admin-list-item flex flex-wrap items-center justify-between gap-3"><div><strong>{profile.name}</strong><p className="text-sm text-[color:var(--admin-muted)]">{profile.email || 'No email'} · {profile.timezone} · {profile.defaultRateCentsPerMinute} cents/min · {profile.specialties.join(', ') || 'No specialties'}</p></div><div className="flex items-center gap-2"><span className={`chip ${profile.isActive ? 'on' : ''}`}>{profile.isActive ? 'Active' : 'Inactive'}</span><button className="admin-button-secondary" type="button" onClick={() => editMentor(profile)}>Edit</button></div></div>)}</div>
      {!data.profiles.length && <p className="mt-4 text-sm text-[color:var(--admin-muted)]">No mentor profile exists yet. Add the actual mentor name and rate above; the workspace does not create placeholder people or invent pricing.</p>}
    </section>

    <div className="grid gap-6 xl:grid-cols-2">
      <section className="admin-card p-5 sm:p-6">
        <div className="admin-section-heading"><Clock3 size={18} /> Record a session</div>
        <p className="mb-4 text-sm text-[color:var(--admin-muted)]">Creates an internal mentorship record; it does not create a Google Calendar event or send an invitation.</p>
        <form onSubmit={createSession} className="grid gap-3">
          <select className="fld" required disabled={!activeProfiles.length} value={sessionForm.profileId || String(activeProfiles[0]?.id || '')} onChange={(event) => setSessionForm({ ...sessionForm, profileId: event.target.value })}><option value="">Select mentor</option>{activeProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select>
          <input className="fld" type="email" required maxLength={200} placeholder="Student email (ledger identifier)" value={sessionForm.menteeEmail} onChange={(event) => setSessionForm({ ...sessionForm, menteeEmail: event.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2"><input className="fld" type="datetime-local" required value={sessionForm.startsAt} onChange={(event) => setSessionForm({ ...sessionForm, startsAt: event.target.value })} /><input className="fld" type="number" min="1" max="720" required placeholder="Planned minutes" value={sessionForm.plannedMinutes} onChange={(event) => setSessionForm({ ...sessionForm, plannedMinutes: event.target.value })} /></div>
          <input className="fld" maxLength={240} placeholder="External reference (optional)" value={sessionForm.externalReference} onChange={(event) => setSessionForm({ ...sessionForm, externalReference: event.target.value })} />
          <textarea className="fld min-h-20" maxLength={2000} placeholder="Private admin notes (optional)" value={sessionForm.notes} onChange={(event) => setSessionForm({ ...sessionForm, notes: event.target.value })} />
          <button className="admin-button w-fit" disabled={!activeProfiles.length || busy === 'create_session'}><Plus size={15} /> Schedule session</button>
        </form>
      </section>

      <section className="admin-card p-5 sm:p-6">
        <div className="admin-section-heading"><GraduationCap size={18} /> Grant free minutes</div>
        <p className="mb-4 text-sm text-[color:var(--admin-muted)]">Grants are recorded against a student email and mentor. Completing a session uses that student’s remaining free minutes before calculating any billable time.</p>
        <form onSubmit={grantAllowance} className="grid gap-3">
          <select className="fld" required disabled={!data.profiles.length} value={grantForm.profileId || String(data.profiles[0]?.id || '')} onChange={(event) => setGrantForm({ ...grantForm, profileId: event.target.value })}><option value="">Select mentor</option>{data.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}{profile.isActive ? '' : ' (inactive)'}</option>)}</select>
          <input className="fld" type="email" required maxLength={200} placeholder="Student email" value={grantForm.menteeEmail} onChange={(event) => setGrantForm({ ...grantForm, menteeEmail: event.target.value })} />
          <input className="fld" type="number" min="1" max="100000" required placeholder="Minutes to grant" value={grantForm.minutes} onChange={(event) => setGrantForm({ ...grantForm, minutes: event.target.value })} />
          <input className="fld" maxLength={500} placeholder="Grant note (optional)" value={grantForm.note} onChange={(event) => setGrantForm({ ...grantForm, note: event.target.value })} />
          <button className="admin-button w-fit" disabled={!data.profiles.length || busy === 'grant_allowance'}><Plus size={15} /> Grant minutes</button>
        </form>
      </section>
    </div>

    <section>
      <div className="admin-section-heading">Student free-minute balances</div>
      {data.balances.length ? <div className="admin-list">{data.balances.map((balance) => <div key={`${balance.profileId}-${balance.menteeEmail}`} className="admin-list-item flex flex-wrap items-center justify-between gap-3"><div><strong>{balance.menteeEmail}</strong><p className="text-sm text-[color:var(--admin-muted)]">{balance.mentorName} · {minutesLabel(balance.grantedMinutes)} granted · {minutesLabel(balance.usedMinutes)} used</p></div><span className="chip on">{minutesLabel(balance.remainingMinutes)} remaining</span></div>)}</div> : <div className="admin-card p-5 text-sm text-[color:var(--admin-muted)]">Student entries appear when you create a session or grant free minutes. Student identity is currently keyed by email; no separate student-profile table is used.</div>}
    </section>

    <section>
      <div className="admin-section-heading">Session history</div>
      {data.sessions.length ? <div className="grid gap-3">{data.sessions.map((session) => {
        const mentor = data.profiles.find((profile) => profile.id === session.profileId);
        return <article key={session.id} className="admin-card p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{mentor?.name || 'Mentor'} · {session.menteeEmail}</h3><p className="mt-1 text-sm text-[color:var(--admin-muted)]">{formatDate(session.startsAt)} · {session.plannedMinutes} planned min · {session.rateCentsPerMinute} cents/min</p>{session.notes && <p className="mt-2 text-sm">{session.notes}</p>}{session.externalReference && <p className="mt-1 text-xs text-[color:var(--admin-muted)]">Reference: {session.externalReference}</p>}</div><span className={`chip ${session.status === 'completed' ? 'on' : ''}`}>{session.status}</span></div>
          {session.status === 'scheduled' && <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[color:var(--admin-border)] pt-4"><label className="text-sm text-[color:var(--admin-muted)]" htmlFor={`actual-${session.id}`}>Actual minutes</label><input id={`actual-${session.id}`} className="fld w-28" type="number" min="1" max="1440" value={actualMinutes[session.id] ?? String(session.plannedMinutes)} onChange={(event) => setActualMinutes({ ...actualMinutes, [session.id]: event.target.value })} /><button className="admin-button-secondary" type="button" disabled={busy === `complete-${session.id}`} onClick={() => { void submit({ action: 'complete_session', sessionId: session.id, actualMinutes: Number(actualMinutes[session.id] ?? session.plannedMinutes) }, 'Session completed; free allowance was applied before billing.'); }}>{busy === `complete-${session.id}` ? 'Saving…' : 'Complete session'}</button><button className="admin-button-secondary" type="button" disabled={busy === `cancel-${session.id}`} onClick={() => { void submit({ action: 'cancel_session', sessionId: session.id }, 'Scheduled session cancelled.'); }}>Cancel</button></div>}
          {session.status === 'completed' && <p className="mt-3 border-t border-[color:var(--admin-border)] pt-3 text-sm text-[color:var(--admin-muted)]">{session.actualMinutes} actual min · {session.totalCents} cents recorded · ends {session.endsAt ? formatDate(session.endsAt) : 'not recorded'}</p>}
        </article>;
      })}</div> : <div className="admin-card p-5 text-sm text-[color:var(--admin-muted)]">No sessions yet.</div>}
    </section>

    <section>
      <div className="admin-section-heading">Recent usage ledger</div>
      {data.ledger.length ? <div className="admin-list">{data.ledger.map((entry) => <div key={entry.id} className="admin-list-item flex flex-wrap items-center justify-between gap-3"><div><strong>{entry.entryType === 'credit' ? 'Free minutes granted' : entry.entryType === 'free_usage' ? 'Free minutes used' : entry.entryType === 'charge' ? 'Billable time' : 'Adjustment'} · {entry.menteeEmail}</strong><p className="text-sm text-[color:var(--admin-muted)]">{formatDate(entry.createdAt)}{entry.sessionId ? ` · Session #${entry.sessionId}` : ''}</p></div><span className="text-sm">{entry.minutes} min · {centsLabel(entry.amountCents)}</span></div>)}</div> : <div className="admin-card p-5 text-sm text-[color:var(--admin-muted)]">No ledger entries yet. Grants and completed session usage will appear here.</div>}
    </section>
  </div>;
}
