'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowUpRight, Briefcase, Check, Clock3, ExternalLink, FilePlus2, Loader2, Plus, Search, Sparkles, X } from 'lucide-react';
import { ACTIVITY_KINDS, APPLICATION_STAGES } from '@/lib/services/opportunity-constants';

type Status = (typeof APPLICATION_STAGES)[number];
type ActivityRow = { id: number; kind: string; title: string; description: string | null; createdAt: string };
type HistoryRow = { id: number; fromStatus: string | null; toStatus: string; description: string | null; changedAt: string };
type TrackedApplication = {
  id: number; status: Status; notes: string | null; applicationDate: string | null; applicationMethod: string | null;
  cvVersion: string | null; coverLetter: string | null; confirmationReference: string | null; recruiterName: string | null;
  recruiterContact: string | null; nextFollowUpDate: string | null; assessmentDate: string | null; interviewDate: string | null;
  interviewNotes: string | null; offerDetails: string | null; finalOutcome: string | null;
};
type Opportunity = {
  id: number; title: string; companyName: string | null; description: string | null; requirements: string | null;
  location: string | null; workMode: string | null; employmentType: string | null; experienceLevel: string | null;
  requiredSkills: string[]; salaryRange: string | null; currency: string | null; applicationDeadline: string | null;
  originType: 'AUTOMATED' | 'MANUAL'; sourcePlatform: string | null; discoveredAt: string;
  originalListingUrl: string | null; applicationUrl: string | null; evidence: Array<{ sourceUrl: string; publisher: string | null }>;
  trackedApplication: TrackedApplication | null; activities: ActivityRow[]; statusHistory: HistoryRow[];
};
type PotentialDuplicate = { id: number; title: string; companyName: string | null; originalListingUrl: string | null; reason: string };
type Preview = {
  title: string; companyName: string; description: string; requirements: string; requiredSkills: string[]; location: string;
  workMode: string; employmentType: string; experienceLevel: string; salaryRange: string; currency: string;
  applicationDeadline: string; applicationUrl: string; originalListingUrl: string; sourcePlatform: string;
  whyRelevant: string; risks: string[];
};
type FormState = {
  title: string; companyName: string; description: string; requirements: string; originalListingUrl: string; applicationUrl: string;
  location: string; workMode: string; employmentType: string; experienceLevel: string; salaryRange: string; currency: string;
  applicationDeadline: string; sourcePlatform: string; requiredSkills: string; contactInformation: string; personalNotes: string;
  initialApplicationStatus: Status;
};
const EMPTY_FORM: FormState = {
  title: '', companyName: '', description: '', requirements: '', originalListingUrl: '', applicationUrl: '', location: '',
  workMode: '', employmentType: '', experienceLevel: '', salaryRange: '', currency: '', applicationDeadline: '',
  sourcePlatform: '', requiredSkills: '', contactInformation: '', personalNotes: '', initialApplicationStatus: 'SAVED',
};
const SOURCE_OPTIONS = ['LinkedIn', 'Wellfound', 'Company Website', 'Indeed', 'Glassdoor', 'Remote Job Board', 'Referral', 'Community', 'Other', 'Custom…'];
const STATUS_LABELS: Record<Status, string> = {
  SAVED: 'Saved', REVIEWING: 'Reviewing', READY_TO_APPLY: 'Ready to apply', APPLIED: 'Applied', ASSESSMENT: 'Assessment',
  INTERVIEW: 'Interview', OFFER: 'Offer', REJECTED: 'Rejected', WITHDRAWN: 'Withdrawn', ARCHIVED: 'Archived',
};
const ACTIVITY_LABELS: Record<string, string> = {
  opportunity_discovered: 'Opportunity discovered', manual_creation: 'Manual creation', ai_research: 'AI research',
  approval: 'Approval', application_preparation: 'Application preparation', application_submission: 'Application submission',
  assessment: 'Assessment', interview_scheduling: 'Interview scheduling', follow_up: 'Follow-up', offer: 'Offer',
  rejection: 'Rejection', withdrawal: 'Withdrawal', custom_note: 'Custom note', duplicate_merged: 'Duplicate merged',
  duplicate_dismissed: 'Duplicate dismissed', details_updated: 'Details updated',
};
const ACTIVITY_OPTIONS = ACTIVITY_KINDS.map((kind) => ({ value: kind, label: ACTIVITY_LABELS[kind] ?? kind }));
const DETAIL_FIELDS: Array<{ key: string; label: string; type?: string; wide?: boolean }> = [
  { key: 'title', label: 'Job title' }, { key: 'companyName', label: 'Company' },
  { key: 'sourcePlatform', label: 'Source platform' }, { key: 'location', label: 'Location' },
  { key: 'workMode', label: 'Work arrangement' }, { key: 'employmentType', label: 'Employment type' },
  { key: 'experienceLevel', label: 'Experience level' }, { key: 'salaryRange', label: 'Salary range' },
  { key: 'currency', label: 'Currency' }, { key: 'applicationDeadline', label: 'Application deadline', type: 'date' },
  { key: 'originalListingUrl', label: 'Original listing URL', type: 'url', wide: true },
  { key: 'applicationUrl', label: 'Application URL', type: 'url', wide: true },
  { key: 'description', label: 'Job description', wide: true }, { key: 'requirements', label: 'Requirements', wide: true },
  { key: 'requiredSkills', label: 'Skills (comma separated)', wide: true },
  { key: 'notes', label: 'Personal notes', wide: true }, { key: 'applicationDate', label: 'Application date', type: 'date' },
  { key: 'applicationMethod', label: 'Application method' }, { key: 'cvVersion', label: 'CV version used' },
  { key: 'coverLetter', label: 'Cover letter', wide: true }, { key: 'confirmationReference', label: 'Confirmation / reference' },
  { key: 'recruiterName', label: 'Recruiter name' }, { key: 'recruiterContact', label: 'Recruiter contact' },
  { key: 'nextFollowUpDate', label: 'Next follow-up', type: 'date' }, { key: 'assessmentDate', label: 'Assessment date', type: 'date' },
  { key: 'interviewDate', label: 'Interview date', type: 'date' }, { key: 'interviewNotes', label: 'Interview notes', wide: true },
  { key: 'offerDetails', label: 'Offer details', wide: true }, { key: 'finalOutcome', label: 'Final outcome', wide: true },
];

function inputValue(value: string | null | undefined) { return value ?? ''; }
function dateLabel(value: string | null | undefined) { return value ? new Date(value).toLocaleString() : '—'; }
function detailSeed(item: Opportunity): Record<string, string> {
  const tracker = item.trackedApplication;
  return {
    title: item.title, companyName: inputValue(item.companyName), sourcePlatform: inputValue(item.sourcePlatform),
    location: inputValue(item.location), workMode: inputValue(item.workMode), employmentType: inputValue(item.employmentType),
    experienceLevel: inputValue(item.experienceLevel), salaryRange: inputValue(item.salaryRange), currency: inputValue(item.currency),
    applicationDeadline: inputValue(item.applicationDeadline), originalListingUrl: inputValue(item.originalListingUrl),
    applicationUrl: inputValue(item.applicationUrl), description: inputValue(item.description), requirements: inputValue(item.requirements),
    requiredSkills: (item.requiredSkills ?? []).join(', '), notes: inputValue(tracker?.notes),
    applicationDate: inputValue(tracker?.applicationDate), applicationMethod: inputValue(tracker?.applicationMethod),
    cvVersion: inputValue(tracker?.cvVersion), coverLetter: inputValue(tracker?.coverLetter),
    confirmationReference: inputValue(tracker?.confirmationReference), recruiterName: inputValue(tracker?.recruiterName),
    recruiterContact: inputValue(tracker?.recruiterContact), nextFollowUpDate: inputValue(tracker?.nextFollowUpDate),
    assessmentDate: inputValue(tracker?.assessmentDate), interviewDate: inputValue(tracker?.interviewDate),
    interviewNotes: inputValue(tracker?.interviewNotes), offerDetails: inputValue(tracker?.offerDetails),
    finalOutcome: inputValue(tracker?.finalOutcome),
  };
}

export default function OpportunityManagement() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [entryMode, setEntryMode] = useState<'quick' | 'url'>('quick');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [customSource, setCustomSource] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [previewRows, setPreviewRows] = useState<Preview[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewExcerpt, setPreviewExcerpt] = useState('');
  const [duplicates, setDuplicates] = useState<PotentialDuplicate[]>([]);
  const [filterText, setFilterText] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailForm, setDetailForm] = useState<Record<string, string>>({});
  const [activityKind, setActivityKind] = useState('custom_note');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [showDetailsEditor, setShowDetailsEditor] = useState(false);

  const refresh = async () => {
    const response = await fetch('/api/admin/opportunities');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Could not load opportunities.');
    const rows = (data.opportunities ?? []) as Opportunity[];
    setItems(rows);
    setSelectedId((current) => current && rows.some((row) => row.id === current) ? current : rows[0]?.id ?? null);
  };
  useEffect(() => { void refresh().catch((error) => setNotice(error instanceof Error ? error.message : 'Could not load opportunities.')).finally(() => setLoading(false)); }, []);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  useEffect(() => { if (selected) setDetailForm(detailSeed(selected)); }, [selected]);
  const sourceNames = useMemo(() => [...new Set(items.map((item) => item.sourcePlatform || item.evidence?.[0]?.publisher || 'Source not listed'))].sort(), [items]);
  const filtered = useMemo(() => items.filter((item) => {
    const source = item.sourcePlatform || item.evidence?.[0]?.publisher || 'Source not listed';
    const haystack = `${item.title} ${item.companyName ?? ''} ${item.description ?? ''} ${item.location ?? ''} ${source} ${(item.requiredSkills ?? []).join(' ')}`.toLowerCase();
    const status = item.trackedApplication?.status ?? 'SAVED';
    return (!filterText || haystack.includes(filterText.toLowerCase())) && (sourceFilter === 'all' || source === sourceFilter) && (originFilter === 'all' || item.originType === originFilter) && (statusFilter === 'all' || status === statusFilter);
  }), [items, filterText, sourceFilter, originFilter, statusFilter]);
  const counts = useMemo(() => ({ total: items.length, manual: items.filter((item) => item.originType === 'MANUAL').length, automated: items.filter((item) => item.originType === 'AUTOMATED').length }), [items]);
  const pipeline = APPLICATION_STAGES.map((status) => ({ status, rows: filtered.filter((item) => (item.trackedApplication?.status ?? 'SAVED') === status) }));

  const setField = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const request = async (id: number, body: Record<string, unknown>) => {
    const response = await fetch(`/api/admin/opportunities/${id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error ?? 'Request failed.');
    return data;
  };
  const openAdd = () => {
    setForm(EMPTY_FORM); setCustomSource(false); setSourceUrl(''); setPreviewRows([]); setPreviewExcerpt(''); setPreviewIndex(0); setDuplicates([]); setEntryMode('quick'); setModalOpen(true); setNotice('');
  };
  const copyPreviewToForm = (preview: Preview, keepCurrent = false) => {
    setCustomSource(Boolean(preview.sourcePlatform && !SOURCE_OPTIONS.includes(preview.sourcePlatform)));
    setForm((current) => ({
      ...current,
      title: preview.title || current.title,
      companyName: preview.companyName || current.companyName,
      description: preview.description || current.description,
      requirements: preview.requirements || current.requirements,
      requiredSkills: preview.requiredSkills.join(', ') || current.requiredSkills,
      location: preview.location || current.location,
      workMode: preview.workMode || current.workMode,
      employmentType: preview.employmentType || current.employmentType,
      experienceLevel: preview.experienceLevel || current.experienceLevel,
      salaryRange: preview.salaryRange || current.salaryRange,
      currency: preview.currency || current.currency,
      applicationDeadline: preview.applicationDeadline || current.applicationDeadline,
      applicationUrl: preview.applicationUrl || current.applicationUrl,
      originalListingUrl: preview.originalListingUrl || current.originalListingUrl,
      sourcePlatform: preview.sourcePlatform || current.sourcePlatform,
    }));
    if (!keepCurrent) setEntryMode('quick');
  };
  const previewUrl = async () => {
    if (!sourceUrl.trim()) { setNotice('Paste a public HTTPS job listing URL first.'); return; }
    setBusy('preview'); setNotice(''); setPreviewRows([]); setDuplicates([]);
    try {
      const response = await fetch('/api/admin/opportunities', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'preview_url', sourceUrl: sourceUrl.trim() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not inspect this listing.');
      const previews = (data.previews ?? []) as Preview[];
      setPreviewExcerpt(data.excerpt ?? '');
      if (!previews.length) {
        let host = 'Other';
        try { host = new URL(sourceUrl).hostname.replace(/^www\./i, ''); } catch { /* form fallback handles invalid URLs */ }
        setCustomSource(!SOURCE_OPTIONS.includes(host));
        setForm((current) => ({ ...current, originalListingUrl: sourceUrl.trim(), sourcePlatform: host }));
        setEntryMode('quick');
        setNotice('No complete job details could be extracted. The URL is saved in the manual form; enter the missing details to continue.');
      } else {
        setPreviewRows(previews); setPreviewIndex(0); copyPreviewToForm(previews[0], true);
        setNotice(`${previews.length} editable preview${previews.length === 1 ? '' : 's'} ready. Review the fields before saving.`);
      }
    } catch (error) {
      setForm((current) => ({ ...current, originalListingUrl: sourceUrl.trim() }));
      setEntryMode('quick');
      setNotice(`${error instanceof Error ? error.message : 'URL extraction failed.'} You can enter the job manually instead.`);
    } finally { setBusy(''); }
  };
  const saveManual = async (resolution?: { type: 'merge' | 'dismiss'; targetId?: number }) => {
    if (!form.title.trim() || !form.companyName.trim()) { setNotice('Job title and company name are required.'); return; }
    setBusy('save'); setNotice('');
    try {
      const body = {
        action: 'create_manual', ...form,
        requiredSkills: form.requiredSkills.split(',').map((value) => value.trim()).filter(Boolean),
        duplicateResolution: resolution?.type,
        mergeTargetId: resolution?.targetId,
        entryMethod: previewRows.length ? 'url_import' : 'quick_add',
      };
      const response = await fetch('/api/admin/opportunities', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (response.status === 409) { setDuplicates(data.duplicateCandidates ?? []); setNotice(data.error ?? 'Review possible duplicates before saving.'); return; }
      if (!response.ok) throw new Error(data.error ?? 'Could not save opportunity.');
      await refresh();
      if (data.opportunity?.id) setSelectedId(data.opportunity.id);
      setModalOpen(false); setDuplicates([]); setNotice(data.merged ? 'Details were merged into the selected opportunity without replacing existing values.' : 'Opportunity saved.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not save opportunity.'); }
    finally { setBusy(''); }
  };
  const changeStatus = async (item: Opportunity, status: Status) => {
    setBusy(`status-${item.id}`); setNotice('');
    try { await request(item.id, { action: 'update_application', status }); await refresh(); setNotice(`Application moved to ${STATUS_LABELS[status]}.`); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Could not update status.'); }
    finally { setBusy(''); }
  };
  const saveDetails = async () => {
    if (!selected) return;
    setBusy('details'); setNotice('');
    try {
      await request(selected.id, { action: 'update_details', ...detailForm, requiredSkills: detailForm.requiredSkills.split(',').map((value) => value.trim()).filter(Boolean) });
      await refresh(); setShowDetailsEditor(false); setNotice('Opportunity and application details saved.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not save details.'); }
    finally { setBusy(''); }
  };
  const addActivity = async () => {
    if (!selected || !activityTitle.trim()) { setNotice('Enter an activity title first.'); return; }
    setBusy('activity');
    try {
      await request(selected.id, { action: 'add_activity', kind: activityKind, activityTitle: activityTitle.trim(), activityDescription: activityDescription.trim() });
      setActivityTitle(''); setActivityDescription(''); await refresh(); setNotice('Activity added to the timeline.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not add activity.'); }
    finally { setBusy(''); }
  };
  const updateDetailField = (key: string, value: string) => setDetailForm((current) => ({ ...current, [key]: value }));

  return <section className="opp-manager" aria-labelledby="opp-manager-title">
    <header className="opp-manager-header">
      <div><p className="opp-kicker">Unified opportunity workspace</p><h2 id="opp-manager-title">Your application pipeline</h2><p>Manual entries and verified-source discoveries stay together. AI suggestions never change your application stage automatically.</p></div>
      <button className="admin-button opp-manager-add" onClick={openAdd}><Plus size={17} /> Add Opportunity</button>
    </header>
    <div className="opp-manager-stats"><span><strong>{counts.total}</strong> total</span><span><strong>{counts.manual}</strong> manual</span><span><strong>{counts.automated}</strong> automated</span></div>
    <div className="opp-manager-filters">
      <label className="opp-manager-search"><Search size={15} /><input type="search" placeholder="Search jobs, companies, skills…" value={filterText} onChange={(event) => setFilterText(event.target.value)} /></label>
      <select className="admin-select" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} aria-label="Filter by source"><option value="all">All sources</option>{sourceNames.map((source) => <option value={source} key={source}>{source}</option>)}</select>
      <select className="admin-select" value={originFilter} onChange={(event) => setOriginFilter(event.target.value)} aria-label="Filter by origin"><option value="all">All origins</option><option value="MANUAL">Manual</option><option value="AUTOMATED">Automated</option></select>
      <select className="admin-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by application status"><option value="all">All stages</option>{APPLICATION_STAGES.map((status) => <option value={status} key={status}>{STATUS_LABELS[status]}</option>)}</select>
    </div>
    {notice && <p className="opp-manager-notice" role="status">{notice}</p>}
    {loading ? <div className="opp-manager-empty"><Loader2 className="animate-spin" size={18} /> Loading opportunities…</div> : !items.length ? <div className="opp-manager-empty"><Briefcase size={24} /><strong>Start your opportunity list</strong><span>Add a job you found yourself, or import a public listing URL for an editable preview.</span><button className="admin-button" onClick={openAdd}><Plus size={15} /> Add Opportunity</button></div> : !filtered.length ? <div className="opp-manager-empty"><Search size={20} /><strong>No opportunities match those filters</strong><span>Try clearing one or more filters.</span></div> : <>
      <div className="opp-manager-board" aria-label="Application pipeline">
        {pipeline.map(({ status, rows }) => <section className="opp-manager-column" key={status} aria-label={`${STATUS_LABELS[status]}: ${rows.length}`}>
          <header><span>{STATUS_LABELS[status]}</span><b>{rows.length}</b></header>
          {rows.map((item) => <article className={`opp-manager-card ${selectedId === item.id ? 'selected' : ''}`} key={item.id}>
            <button className="opp-manager-card-open" onClick={() => { setSelectedId(item.id); setShowDetailsEditor(false); }}><strong>{item.title}</strong><span>{item.companyName || 'Company not listed'}</span><small>{item.sourcePlatform || item.evidence?.[0]?.publisher || 'Source not listed'}</small></button>
            <div className="opp-manager-badges"><span className={`opp-pill ${item.originType === 'MANUAL' ? 'is-gold' : 'is-ok'}`}>{item.originType === 'MANUAL' ? 'Manual' : 'Automated'}</span><span className="opp-pill">{item.sourcePlatform || 'Other'}</span></div>
            <select className="admin-select" value={item.trackedApplication?.status ?? 'SAVED'} disabled={busy === `status-${item.id}`} onChange={(event) => void changeStatus(item, event.target.value as Status)} aria-label={`Application stage for ${item.title}`}>{APPLICATION_STAGES.map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}</select>
          </article>)}
          {!rows.length && <p className="opp-manager-column-empty">Nothing here yet</p>}
        </section>)}
      </div>
      {selected && <section className="opp-manager-detail" aria-label={`Details for ${selected.title}`}>
        <div className="opp-manager-detail-heading"><div><p className="opp-kicker">{selected.originType === 'MANUAL' ? 'Manual opportunity' : 'Automated discovery'} · added {dateLabel(selected.discoveredAt)}</p><h3>{selected.title}</h3><p>{selected.companyName || 'Company not listed'}{selected.location ? ` · ${selected.location}` : ''}</p><div className="opp-manager-badges"><span className={`opp-pill ${selected.originType === 'MANUAL' ? 'is-gold' : 'is-ok'}`}>{selected.originType}</span><span className="opp-pill">{selected.sourcePlatform || 'Other'}</span>{selected.workMode && <span className="opp-pill">{selected.workMode}</span>}</div></div>
          <div className="opp-manager-detail-actions"><select className="admin-select" value={selected.trackedApplication?.status ?? 'SAVED'} onChange={(event) => void changeStatus(selected, event.target.value as Status)} aria-label="Application stage">{APPLICATION_STAGES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select><button className="admin-button-secondary" onClick={() => setShowDetailsEditor((current) => !current)}>{showDetailsEditor ? 'Close editor' : 'Edit details'}</button></div>
        </div>
        {showDetailsEditor ? <div className="opp-manager-detail-editor"><div className="opp-manager-detail-grid">{DETAIL_FIELDS.map(({ key, label, type, wide }) => <label className={wide ? 'wide' : ''} key={key}><span>{label}</span>{['description', 'requirements', 'requiredSkills', 'notes', 'coverLetter', 'interviewNotes', 'offerDetails', 'finalOutcome'].includes(key) ? <textarea className="fld" rows={key === 'description' || key === 'requirements' ? 3 : 2} value={detailForm[key] ?? ''} onChange={(event) => updateDetailField(key, event.target.value)} /> : <input className="fld" type={type ?? 'text'} value={detailForm[key] ?? ''} onChange={(event) => updateDetailField(key, event.target.value)} />}</label>)}</div><button className="admin-button" onClick={() => void saveDetails()} disabled={busy === 'details'}>{busy === 'details' ? <Loader2 className="animate-spin" size={15} /> : <Check size={15} />} Save details</button></div> : <>
          <div className="opp-manager-info-grid"><div><strong>Job description</strong><p>{selected.description || 'No description provided.'}</p></div><div><strong>Requirements & skills</strong><p>{selected.requirements || (selected.requiredSkills?.length ? selected.requiredSkills.join(', ') : 'No requirements captured.')}</p></div><div><strong>Employment & salary</strong><p>{[selected.employmentType, selected.experienceLevel, selected.salaryRange && `${selected.salaryRange} ${selected.currency || ''}`.trim()].filter(Boolean).join(' · ') || 'Not specified'}</p></div></div>
          <div className="opp-manager-links">{selected.originalListingUrl && <a href={selected.originalListingUrl} target="_blank" rel="noreferrer">Original listing <ExternalLink size={13} /></a>}{selected.applicationUrl && <a href={selected.applicationUrl} target="_blank" rel="noreferrer">Apply <ArrowUpRight size={13} /></a>}<span>Deadline: {selected.applicationDeadline || 'Not listed'}</span></div>
          <div className="opp-manager-app-fields"><p><strong>Application record</strong> — optional details</p><span>Method: {selected.trackedApplication?.applicationMethod || '—'}</span><span>Applied: {selected.trackedApplication?.applicationDate || '—'}</span><span>Next follow-up: {selected.trackedApplication?.nextFollowUpDate || '—'}</span><span>Recruiter: {selected.trackedApplication?.recruiterName || '—'}</span></div>
        </>}
        <div className="opp-manager-activity-grid">
          <section className="opp-manager-timeline"><h4><Activity size={15} /> Activity timeline</h4>{[...(selected.activities ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((event) => <article className="opp-manager-event" key={`activity-${event.id}`}><span className="opp-manager-event-dot" /><div><strong>{event.title}</strong><small><Clock3 size={12} /> {dateLabel(event.createdAt)} · {ACTIVITY_LABELS[event.kind] ?? event.kind}</small>{event.description && <p>{event.description}</p>}</div></article>)}{!selected.activities?.length && <p className="opp-manager-column-empty">No activity recorded yet.</p>}
            <details className="opp-manager-add-activity"><summary>Add activity or note</summary><div className="opp-manager-activity-form"><select className="admin-select" value={activityKind} onChange={(event) => setActivityKind(event.target.value)}>{ACTIVITY_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select><input className="fld" placeholder="Activity title" value={activityTitle} onChange={(event) => setActivityTitle(event.target.value)} /><textarea className="fld" rows={2} placeholder="Optional description" value={activityDescription} onChange={(event) => setActivityDescription(event.target.value)} /><button className="admin-button-secondary" onClick={() => void addActivity()} disabled={busy === 'activity'}>Add to timeline</button></div></details>
          </section>
          <section className="opp-manager-history"><h4><Clock3 size={15} /> Status history</h4>{[...(selected.statusHistory ?? [])].sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()).map((event) => <article className="opp-manager-history-row" key={event.id}><strong>{event.fromStatus ? `${STATUS_LABELS[event.fromStatus as Status] ?? event.fromStatus} → ` : ''}{STATUS_LABELS[event.toStatus as Status] ?? event.toStatus}</strong><small>{dateLabel(event.changedAt)}</small>{event.description && <p>{event.description}</p>}</article>)}{!selected.statusHistory?.length && <p className="opp-manager-column-empty">No status changes yet.</p>}</section>
        </div>
      </section>}
    </>}

    {modalOpen && <div className="opp-manager-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><section className="opp-manager-modal" role="dialog" aria-modal="true" aria-labelledby="opp-add-title"><header><div><p className="opp-kicker">Manual opportunity</p><h3 id="opp-add-title">Add Opportunity</h3><p>Save a partial record now and add details later.</p></div><button className="admin-icon-btn" aria-label="Close" onClick={() => setModalOpen(false)}><X size={17} /></button></header>
      <div className="opp-manager-entry-tabs"><button className={entryMode === 'quick' ? 'active' : ''} onClick={() => setEntryMode('quick')}><FilePlus2 size={15} /> Quick entry</button><button className={entryMode === 'url' ? 'active' : ''} onClick={() => setEntryMode('url')}><Sparkles size={15} /> Import from URL</button></div>
      {entryMode === 'url' && <div className="opp-manager-url-box"><label><span>Public job listing URL</span><input className="fld" type="url" placeholder="https://company.example/careers/role" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} /></label><button className="admin-button-secondary" onClick={() => void previewUrl()} disabled={busy === 'preview'}>{busy === 'preview' ? <Loader2 className="animate-spin" size={15} /> : <Sparkles size={15} />} Extract editable preview</button>{previewExcerpt && <small className="opp-manager-excerpt">Source excerpt reviewed by AI: {previewExcerpt}</small>}{previewRows.length > 1 && <div className="opp-manager-preview-picker">{previewRows.map((preview, index) => <button className={previewIndex === index ? 'active' : ''} key={`${preview.title}-${index}`} onClick={() => { setPreviewIndex(index); copyPreviewToForm(preview, true); }}>{preview.title} · {preview.companyName || 'Company missing'}</button>)}</div>}{previewRows.length > 0 && <p className="opp-manager-safe-note">Fields below are editable. Missing facts stay blank; review before saving.</p>}</div>}
      <div className="opp-manager-form-grid">
        <label><span>Job title <b>Required</b></span><input className="fld" value={form.title} onChange={(event) => setField('title', event.target.value)} /></label>
        <label><span>Company name <b>Required</b></span><input className="fld" value={form.companyName} onChange={(event) => setField('companyName', event.target.value)} /></label>
        <label className="wide"><span>Job description</span><textarea className="fld" rows={3} value={form.description} onChange={(event) => setField('description', event.target.value)} /></label>
        <label className="wide"><span>Requirements</span><textarea className="fld" rows={2} value={form.requirements} onChange={(event) => setField('requirements', event.target.value)} /></label>
        <label><span>Original listing URL</span><input className="fld" type="url" value={form.originalListingUrl} onChange={(event) => setField('originalListingUrl', event.target.value)} /></label>
        <label><span>Application URL</span><input className="fld" type="url" value={form.applicationUrl} onChange={(event) => setField('applicationUrl', event.target.value)} /></label>
        <label><span>Location</span><input className="fld" value={form.location} onChange={(event) => setField('location', event.target.value)} /></label>
        <label><span>Work arrangement</span><select className="admin-select" value={form.workMode} onChange={(event) => setField('workMode', event.target.value)}><option value="">Not specified</option><option>Remote</option><option>Hybrid</option><option>Onsite</option></select></label>
        <label><span>Employment type</span><input className="fld" placeholder="Full-time, contract…" value={form.employmentType} onChange={(event) => setField('employmentType', event.target.value)} /></label>
        <label><span>Experience level</span><input className="fld" placeholder="Entry, mid, senior…" value={form.experienceLevel} onChange={(event) => setField('experienceLevel', event.target.value)} /></label>
        <label><span>Salary range</span><input className="fld" placeholder="e.g. 90k–120k" value={form.salaryRange} onChange={(event) => setField('salaryRange', event.target.value)} /></label>
        <label><span>Currency</span><input className="fld" placeholder="USD" value={form.currency} onChange={(event) => setField('currency', event.target.value.toUpperCase())} /></label>
        <label><span>Application deadline</span><input className="fld" type="date" value={form.applicationDeadline} onChange={(event) => setField('applicationDeadline', event.target.value)} /></label>
        <label><span>Source platform</span>{customSource ? <input className="fld" placeholder="Enter a source name" value={form.sourcePlatform} onChange={(event) => setField('sourcePlatform', event.target.value)} /> : <select className="admin-select" value={SOURCE_OPTIONS.includes(form.sourcePlatform) ? form.sourcePlatform : form.sourcePlatform ? 'Custom…' : ''} onChange={(event) => { if (event.target.value === 'Custom…') { setCustomSource(true); setField('sourcePlatform', ''); } else { setCustomSource(false); setField('sourcePlatform', event.target.value); } }}><option value="">Select a source (optional)</option>{SOURCE_OPTIONS.map((source) => <option key={source} value={source}>{source}</option>)}</select>}</label>
        <label className="wide"><span>Skills (comma separated)</span><input className="fld" value={form.requiredSkills} onChange={(event) => setField('requiredSkills', event.target.value)} /></label>
        <label><span>Contact information</span><input className="fld" placeholder="Name, email or profile" value={form.contactInformation} onChange={(event) => setField('contactInformation', event.target.value)} /></label>
        <label><span>Initial application stage</span><select className="admin-select" value={form.initialApplicationStatus} onChange={(event) => setField('initialApplicationStatus', event.target.value as Status)}>{APPLICATION_STAGES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select></label>
        <label className="wide"><span>Personal notes</span><textarea className="fld" rows={2} value={form.personalNotes} onChange={(event) => setField('personalNotes', event.target.value)} /></label>
      </div>
      {duplicates.length > 0 && <section className="opp-manager-duplicates"><h4>Review potential duplicates before saving</h4><p>Existing information will not be overwritten. Choose a record to merge missing fields into, or dismiss the matches to save separately.</p>{duplicates.map((duplicate) => <article key={duplicate.id}><div><strong>{duplicate.title}</strong><span>{duplicate.companyName || 'Company not listed'} · {duplicate.reason === 'matching_url' ? 'URL match' : 'Company and title match'}</span></div><button className="admin-button-secondary" onClick={() => void saveManual({ type: 'merge', targetId: duplicate.id })} disabled={busy === 'save'}>Merge into this</button></article>)}<button className="opp-manager-dismiss" onClick={() => void saveManual({ type: 'dismiss' })} disabled={busy === 'save'}>Dismiss suggestions and save as separate opportunity</button></section>}
      {notice && <p className="opp-manager-notice" role="alert">{notice}</p>}
      <footer><button className="admin-button-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="admin-button" onClick={() => void saveManual()} disabled={busy === 'save'}>{busy === 'save' ? <Loader2 className="animate-spin" size={15} /> : <Check size={15} />} Save opportunity</button></footer>
    </section></div>}
  </section>;
}
