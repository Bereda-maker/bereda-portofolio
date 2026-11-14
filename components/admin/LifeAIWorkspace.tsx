'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BookmarkCheck, Brain, Check, Copy, Loader2, MessageSquarePlus, MoreHorizontal, Pencil, Search, Send, Settings2, Sparkles, StopCircle, Trash2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import LifeAIRichBlockRenderer, { type BookResourceAction, type BookResourceState, type VideoResourceAction, type VideoResourceState } from '@/components/admin/LifeAIRichBlocks';
import { LifeAiRichBlockSchema, LifeAiRichBlocksSchema, OpenLibraryBookSchema, type LifeAiRichBlock, type OpenLibraryBook, type YouTubeVideo, YouTubeVideoSchema } from '@/lib/life-ai-rich-content';
import { readLifeAiStream } from '@/lib/life-ai-stream';

type Context = Record<'preferences' | 'goals' | 'commitments' | 'habits' | 'journal' | 'relationships' | 'finances' | 'conversations', boolean>;
type Conversation = { id: number; title: string; createdAt: string; updatedAt: string };
type Message = { id?: number; role: 'user' | 'assistant'; content: string; createdAt?: string; streaming?: boolean; blocks?: LifeAiRichBlock[] };
const DEFAULT_CONTEXT: Context = { preferences: true, goals: true, commitments: true, habits: false, journal: false, relationships: false, finances: false, conversations: true };
const contextLabels: Record<keyof Context, string> = { preferences: 'Preferences', goals: 'Goals & priorities', commitments: 'Calendar commitments', habits: 'Habits & routines', journal: 'Journal & reflections', relationships: 'Relationships', finances: 'Financial wellbeing', conversations: 'Previous conversations' };
const prompts = ['Help me plan a balanced week.', "Let's reflect on how my life is going.", 'Help me understand my priorities.', 'Review my habits and routines.', 'Help me improve my financial discipline.', 'Suggest meaningful activities outside work.', 'Help me set personal goals.', 'Prepare my monthly life review.'];

function richBlockKey(message: Message, messageIndex: number, blockIndex: number) { return `${message.id ?? `draft-${messageIndex}`}:${blockIndex}`; }

function Markdown({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  // Re-parse the complete accumulated snapshot on each delta. ReactMarkdown treats
  // unfinished Markdown as text/code until it becomes valid and never injects raw HTML.
  return <div className="life-ai-markdown" data-streaming={isStreaming || undefined}>
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeHighlight]}>{content}</ReactMarkdown>
  </div>;
}

export default function LifeAIWorkspace() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [context, setContext] = useState<Context>(DEFAULT_CONTEXT);
  const [draft, setDraft] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [greeting, setGreeting] = useState('Welcome back, Bereda.');
  const [savedOpen, setSavedOpen] = useState(false);
  const [savedStates, setSavedStates] = useState<Record<string, VideoResourceState>>({});
  const [savedVideos, setSavedVideos] = useState<Record<string, YouTubeVideo>>({});
  const [bookStates, setBookStates] = useState<Record<string, BookResourceState>>({});
  const [savedBooks, setSavedBooks] = useState<Record<string, OpenLibraryBook>>({});
  const [loadingMore, setLoadingMore] = useState<Record<string, boolean>>({});
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  async function refreshConversations() { const response = await fetch('/api/admin/life-ai/conversations'); const data = await response.json(); if (response.ok) setConversations(data.conversations); }
  async function refreshSavedResources() {
    const response = await fetch('/api/admin/life-ai/resources', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json() as { resources?: Array<{ resourceType: string; resourceKey: string; isFavorite: boolean; isWatched: boolean; metadata?: { video?: unknown; book?: unknown } }> };
    const states: Record<string, VideoResourceState> = {};
    const videos: Record<string, YouTubeVideo> = {};
    const readStates: Record<string, BookResourceState> = {};
    const books: Record<string, OpenLibraryBook> = {};
    for (const item of data.resources ?? []) {
      if (item.resourceType === 'youtube_video') {
        states[item.resourceKey] = { isFavorite: item.isFavorite, isWatched: item.isWatched };
        const parsedVideo = YouTubeVideoSchema.safeParse(item.metadata?.video);
        if (parsedVideo.success) videos[parsedVideo.data.videoId] = parsedVideo.data;
      } else if (item.resourceType === 'book') {
        readStates[item.resourceKey] = { isFavorite: item.isFavorite, isRead: item.isWatched };
        const parsedBook = OpenLibraryBookSchema.safeParse(item.metadata?.book);
        if (parsedBook.success) books[parsedBook.data.workId] = parsedBook.data;
      }
    }
    setSavedStates(states);
    setSavedVideos(videos);
    setBookStates(readStates);
    setSavedBooks(books);
  }
  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Good morning, Bereda.' : hour < 18 ? 'Good afternoon, Bereda.' : 'Good evening, Bereda.');
  }, []);
  useEffect(() => { void Promise.all([refreshConversations(), refreshSavedResources(), fetch('/api/admin/life-ai/context').then((response) => response.json()).then((data) => data.context && setContext(data.context))]); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, loading]);

  async function openConversation(id: number) { setLoadingConversation(true); setError(''); setMenuId(null); try { const response = await fetch(`/api/admin/life-ai/conversations/${id}`); const data = await response.json(); if (!response.ok) throw new Error(data.error); const loadedMessages = (data.conversation.messages as Message[]).map((message) => ({ ...message, blocks: LifeAiRichBlocksSchema.safeParse(message.blocks ?? []).success ? LifeAiRichBlocksSchema.parse(message.blocks ?? []) : [] })); setConversationId(id); setMessages(loadedMessages); setHistoryOpen(false); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not open conversation.'); } finally { setLoadingConversation(false); } }
  function newConversation() { if (loading) return; setConversationId(null); setMessages([]); setDraft(''); setError(''); setHistoryOpen(false); }

  async function send(content = draft) {
    const value = content.trim(); if (!value || loading) return;
    setDraft(''); setError(''); setLoading(true); setMessages((current) => [...current, { role: 'user', content: value }, { role: 'assistant', content: '', streaming: true }]);
    const controller = new AbortController(); abortRef.current = controller;
    try {
      const response = await fetch('/api/admin/life-ai/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ conversationId: conversationId ?? undefined, content: value }), signal: controller.signal });
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Could not start the AI response.'); }
      if (!response.body) throw new Error('The AI provider did not return a stream.');
      for await (const payload of readLifeAiStream(response.body)) {
        if (payload.type === 'meta' && payload.conversationId) setConversationId(payload.conversationId);
        if (payload.type === 'delta' && payload.content) setMessages((current) => current.map((message, index) => index === current.length - 1 ? { ...message, content: message.content + payload.content } : message));
        if (payload.type === 'block') {
          const parsedBlock = LifeAiRichBlockSchema.safeParse(payload.block);
          if (parsedBlock.success) setMessages((current) => current.map((message, index) => index === current.length - 1 ? { ...message, blocks: [...(message.blocks ?? []), parsedBlock.data] } : message));
        }
        if (payload.type === 'error') throw new Error(payload.message || 'The AI stream was interrupted.');
      }
      setMessages((current) => current.map((message, index) => index === current.length - 1 ? { ...message, streaming: false } : message)); await refreshConversations();
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) { setError(cause instanceof Error ? cause.message : 'Could not send your message.'); setMessages((current) => current.slice(0, -2)); }
      else setMessages((current) => current.map((message, index) => index === current.length - 1 ? { ...message, streaming: false } : message));
    } finally { setLoading(false); abortRef.current = null; }
  }
  function stopGeneration() { abortRef.current?.abort(); }
  async function clearConversation(id = conversationId) { if (!id || !window.confirm('Delete this conversation and its messages? This cannot be undone.')) return; const response = await fetch(`/api/admin/life-ai/conversations/${id}`, { method: 'DELETE' }); if (!response.ok) { setError('Could not delete the conversation.'); return; } if (id === conversationId) newConversation(); setMenuId(null); await refreshConversations(); }
  function startRename(item: Conversation) { setMenuId(null); setRenamingId(item.id); setRenameDraft(item.title); }
  async function saveRename(id: number) { const title = renameDraft.trim(); if (!title) return; const response = await fetch(`/api/admin/life-ai/conversations/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title }) }); if (!response.ok) { setError('Could not rename the conversation.'); return; } setRenamingId(null); await refreshConversations(); }
  async function saveContext(next: Context) { setContext(next); const response = await fetch('/api/admin/life-ai/context', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(next) }); if (!response.ok) setError('Could not save context settings.'); }
  async function copyMessage(index: number, content: string) { await navigator.clipboard.writeText(content); setCopied(index); window.setTimeout(() => setCopied(null), 1400); }
  async function updateVideoState(video: YouTubeVideo, action: VideoResourceAction) {
    try {
      const response = await fetch('/api/admin/life-ai/resources', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ resourceType: 'youtube_video', action, resource: video }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update the saved video.');
      const state = data.state as VideoResourceState & { resourceKey: string };
      setSavedStates((current) => ({ ...current, [state.resourceKey]: { isFavorite: state.isFavorite, isWatched: state.isWatched } }));
      setSavedVideos((current) => {
        const next = { ...current };
        if (state.isFavorite || state.isWatched) next[state.resourceKey] = video;
        else delete next[state.resourceKey];
        return next;
      });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update the saved video.'); }
  }
  async function updateBookState(book: OpenLibraryBook, action: BookResourceAction) {
    try {
      const response = await fetch('/api/admin/life-ai/resources', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ resourceType: 'book', action, resource: book }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update the saved book.');
      const state = data.state as { resourceKey: string; isFavorite: boolean; isWatched: boolean };
      setBookStates((current) => ({ ...current, [state.resourceKey]: { isFavorite: state.isFavorite, isRead: state.isWatched } }));
      setSavedBooks((current) => {
        const next = { ...current };
        if (state.isFavorite || state.isWatched) next[state.resourceKey] = book;
        else delete next[state.resourceKey];
        return next;
      });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update the saved book.'); }
  }
  async function loadMoreVideos(messageIndex: number, blockIndex: number, block: Extract<LifeAiRichBlock, { type: 'youtube_videos' }>) {
    const key = richBlockKey(messages[messageIndex], messageIndex, blockIndex);
    setLoadingMore((current) => ({ ...current, [key]: true }));
    try {
      const params = new URLSearchParams({ query: block.query, ...(block.nextPageToken ? { pageToken: block.nextPageToken } : {}) });
      const response = await fetch(`/api/admin/life-ai/youtube?${params}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load more videos.');
      const parsed = LifeAiRichBlockSchema.safeParse(data.block);
      if (!parsed.success) throw new Error('YouTube returned an invalid result block.');
      setMessages((current) => current.map((message, index) => {
        if (index !== messageIndex) return message;
        const blocks = [...(message.blocks ?? [])];
        const existing = blocks[blockIndex];
        if (existing?.type === 'youtube_videos' && parsed.data.type === 'youtube_videos') {
          const seen = new Set(existing.items.map((item) => item.videoId));
          const items = [...existing.items, ...parsed.data.items.filter((item) => !seen.has(item.videoId))].slice(0, 30);
          blocks[blockIndex] = { ...existing, items, nextPageToken: items.length >= 30 ? undefined : parsed.data.nextPageToken };
        } else blocks.splice(blockIndex + 1, 0, parsed.data);
        return { ...message, blocks };
      }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load more videos.'); }
    finally { setLoadingMore((current) => ({ ...current, [key]: false })); }
  }
  async function loadMoreBooks(messageIndex: number, blockIndex: number, block: Extract<LifeAiRichBlock, { type: 'book_recommendations' }>) {
    const key = richBlockKey(messages[messageIndex], messageIndex, blockIndex);
    if (!block.nextPage) return;
    setLoadingMore((current) => ({ ...current, [key]: true }));
    try {
      const params = new URLSearchParams({ query: block.query, page: String(block.nextPage) });
      const response = await fetch(`/api/admin/life-ai/books?${params}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load more books.');
      const parsed = LifeAiRichBlockSchema.safeParse(data.block);
      if (!parsed.success) throw new Error('Open Library returned an invalid result block.');
      setMessages((current) => current.map((message, index) => {
        if (index !== messageIndex) return message;
        const blocks = [...(message.blocks ?? [])];
        const existing = blocks[blockIndex];
        if (existing?.type === 'book_recommendations' && parsed.data.type === 'book_recommendations') {
          const seen = new Set(existing.items.map((item) => item.workId));
          const items = [...existing.items, ...parsed.data.items.filter((item) => !seen.has(item.workId))].slice(0, 30);
          blocks[blockIndex] = { ...existing, items, nextPage: items.length >= 30 ? undefined : parsed.data.nextPage };
        } else blocks.splice(blockIndex + 1, 0, parsed.data);
        return { ...message, blocks };
      }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load more books.'); }
    finally { setLoadingMore((current) => ({ ...current, [key]: false })); }
  }

  const filteredConversations = useMemo(() => { const term = historySearch.trim().toLowerCase(); return term ? conversations.filter((item) => item.title.toLowerCase().includes(term)) : conversations; }, [conversations, historySearch]);
  const activeTitle = useMemo(() => conversations.find((item) => item.id === conversationId)?.title, [conversations, conversationId]);
  const savedVideoList = useMemo(() => Object.values(savedVideos), [savedVideos]);
  const savedBookList = useMemo(() => Object.values(savedBooks), [savedBooks]);
  return <div className="life-ai-page">
    <header className="life-ai-header"><div><div className="life-ai-eyebrow"><span className="life-ai-mark"><Brain size={17} /></span> Private workspace · Your Life AI</div><h1 className="admin-title">A quieter place to think clearly.</h1><p className="admin-description">One central assistant for planning, reflection, growth, and the decisions that connect them.</p></div><button type="button" className="admin-button-secondary life-ai-settings-button" onClick={() => setSettingsOpen(true)}><Settings2 size={16} /> Context access</button></header>
    <div className="life-ai-consent-strip"><Sparkles size={16} /><span>Suggestions use only the context categories you enable. I’ll make suggestions, not assumptions.</span><button type="button" onClick={() => setSettingsOpen(true)}>Review access</button></div>
    <div className="life-ai-layout">
      <aside className={`life-ai-history${historyOpen ? ' mobile-open' : ''}`}><div className="life-ai-history-head"><div><span className="admin-eyebrow">Your space</span><strong>Recent conversations</strong></div><button type="button" className="admin-icon-btn" onClick={() => setHistoryOpen(false)} aria-label="Close history"><X size={17} /></button></div><button type="button" className="admin-button life-ai-new" onClick={newConversation}><MessageSquarePlus size={16} /> New conversation</button><label className="life-ai-search"><Search size={15} /><input type="search" value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Search conversations" aria-label="Search conversations" /></label><div className="life-ai-history-list">{filteredConversations.map((item) => <div className={`life-ai-history-item${item.id === conversationId ? ' active' : ''}`} key={item.id}>{renamingId === item.id ? <form className="life-ai-rename" onSubmit={(event) => { event.preventDefault(); void saveRename(item.id); }}><input autoFocus value={renameDraft} onChange={(event) => setRenameDraft(event.target.value)} onKeyDown={(event) => event.key === 'Escape' && setRenamingId(null)} /><button type="submit" aria-label="Save name"><Check size={14} /></button></form> : <><button type="button" className="life-ai-history-open" onClick={() => void openConversation(item.id)}><span>{item.title}</span><small>{new Date(item.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</small></button><button type="button" className="life-ai-history-more" onClick={() => setMenuId(menuId === item.id ? null : item.id)} aria-label={`Actions for ${item.title}`}><MoreHorizontal size={16} /></button>{menuId === item.id && <div className="life-ai-history-menu"><button type="button" onClick={() => startRename(item)}><Pencil size={14} /> Rename</button><button type="button" onClick={() => void clearConversation(item.id)}><Trash2 size={14} /> Delete</button></div>}</>}</div>)}{!filteredConversations.length && <p className="life-ai-history-empty">{historySearch ? 'No conversations match that search.' : 'Your conversations will appear here.'}</p>}</div></aside>
      <section className="life-ai-chat" aria-label="Your Life AI conversation">
        <div className="life-ai-chat-top"><button type="button" className="admin-button-secondary life-ai-mobile-history" onClick={() => setHistoryOpen(true)}>History</button><div className="life-ai-chat-title"><span className="life-ai-status-dot" /> <span>{activeTitle ?? 'New conversation'}</span></div><button type="button" className="admin-button-secondary life-ai-saved-toggle" onClick={() => setSavedOpen((open) => !open)} aria-pressed={savedOpen}><BookmarkCheck size={15} /> Saved resources <span>{savedVideoList.length + savedBookList.length}</span></button><button type="button" className="admin-icon-btn" onClick={() => void clearConversation()} disabled={!conversationId || loading} aria-label="Delete conversation"><Trash2 size={17} /></button></div>
        {savedOpen && <section className="life-ai-saved-panel" aria-labelledby="life-ai-saved-title"><div className="life-ai-saved-head"><div><span className="admin-eyebrow">Your library</span><h2 id="life-ai-saved-title">Saved resources</h2><p>Videos you watched and books you have read are tracked here.</p></div><button type="button" className="admin-icon-btn" onClick={() => setSavedOpen(false)} aria-label="Close saved resources"><X size={16} /></button></div>{savedVideoList.length > 0 && <LifeAIRichBlockRenderer block={{ type: 'youtube_videos', query: 'Saved videos', items: savedVideoList }} states={savedStates} bookStates={bookStates} onVideoAction={(video, action) => void updateVideoState(video, action)} onBookAction={(book, action) => void updateBookState(book, action)} onMore={() => undefined} onMoreBooks={() => undefined} />}{savedBookList.length > 0 && <LifeAIRichBlockRenderer block={{ type: 'book_recommendations', query: 'Saved books', items: savedBookList }} states={savedStates} bookStates={bookStates} onVideoAction={(video, action) => void updateVideoState(video, action)} onBookAction={(book, action) => void updateBookState(book, action)} onMore={() => undefined} onMoreBooks={() => undefined} />}{!savedVideoList.length && !savedBookList.length && <p className="life-ai-saved-empty">Videos and books you save or mark watched/read will appear here.</p>}</section>}
        <div className="life-ai-messages">{!messages.length && <div className="life-ai-welcome"><div className="life-ai-welcome-icon"><Brain size={25} /></div><span className="life-ai-welcome-kicker">{greeting}</span><h2>What would make today feel more like yours?</h2><p>Start anywhere. I can help you make a gentle plan, notice a pattern, or turn a vague feeling into a next step.</p><div className="life-ai-prompts">{prompts.map((prompt) => <button type="button" key={prompt} onClick={() => void send(prompt)}>{prompt}<Send size={14} /></button>)}</div></div>}{messages.map((message, index) => <article className={`life-ai-message ${message.role}`} key={message.id ?? `${message.role}-${index}`}><div className="life-ai-message-avatar">{message.role === 'assistant' ? <Brain size={15} /> : 'You'}</div><div className="life-ai-message-body"><div className="life-ai-message-meta"><strong>{message.role === 'assistant' ? 'Your Life AI' : 'You'}</strong>{message.createdAt && <time>{new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>}</div>{message.role === 'assistant' ? message.content ? <Markdown content={message.content} isStreaming={message.streaming} /> : <div className="life-ai-streaming-placeholder"><span /><span /><span /></div> : <p>{message.content}</p>}{message.role === 'assistant' && message.blocks?.map((block, blockIndex) => <LifeAIRichBlockRenderer key={richBlockKey(message, index, blockIndex)} block={block} states={savedStates} bookStates={bookStates} onVideoAction={(video, action) => void updateVideoState(video, action)} onBookAction={(book, action) => void updateBookState(book, action)} onMore={(nextBlock) => void loadMoreVideos(index, blockIndex, nextBlock)} onMoreBooks={(nextBlock) => void loadMoreBooks(index, blockIndex, nextBlock)} loadingMore={Boolean(loadingMore[richBlockKey(message, index, blockIndex)])} />)}{message.role === 'assistant' && <button type="button" className="life-ai-copy" onClick={() => void copyMessage(index, message.content)} disabled={!message.content}>{copied === index ? <Check size={13} /> : <Copy size={13} />} {copied === index ? 'Copied' : 'Copy'}</button>}</div></article>)}{loading && <div className="life-ai-thinking"><Loader2 size={16} className="life-ai-spin" /> Writing a thoughtful response…</div>}<div ref={messagesEndRef} /></div>
        {error && <div className="admin-error" role="alert"><span>{error}</span></div>}
        <form className="life-ai-composer" onSubmit={(event) => { event.preventDefault(); void send(); }}><textarea className="fld life-ai-composer-input" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="Ask Your Life AI anything…" rows={3} aria-label="Message Your Life AI" /><div className="life-ai-composer-foot"><span>Enter to send · Shift + Enter for a new line</span>{loading ? <button type="button" className="admin-button-secondary" onClick={stopGeneration}><StopCircle size={16} /> Stop generating</button> : <button type="submit" className="admin-button" disabled={!draft.trim()}><Send size={16} /> Send</button>}</div></form>
      </section>
    </div>
    {settingsOpen && <div className="admin-overlay admin-overlay-center" role="presentation" onMouseDown={() => setSettingsOpen(false)}><section className="admin-dialog life-ai-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="life-ai-settings-title" onMouseDown={(event) => event.stopPropagation()}><div className="life-ai-dialog-head"><div><span className="admin-eyebrow">Consent & memory</span><h2 id="life-ai-settings-title">Choose what I can use</h2></div><button type="button" className="admin-icon-btn" onClick={() => setSettingsOpen(false)} aria-label="Close settings"><X size={17} /></button></div><p className="admin-dialog-body">These controls apply to future responses. Disabled categories are not retrieved or treated as known facts.</p><div className="life-ai-context-list">{(Object.keys(contextLabels) as Array<keyof Context>).map((key) => <label className="admin-check-row" key={key}><input type="checkbox" checked={context[key]} onChange={(event) => void saveContext({ ...context, [key]: event.target.checked })} /><span><strong>{contextLabels[key]}</strong><small>{key === 'commitments' ? 'Read-only tasks and planned calendar blocks.' : key === 'journal' ? 'Private reflections; off unless you explicitly enable it.' : 'Available only when you choose to enable it.'}</small></span></label>)}</div><div className="admin-dialog-actions"><button type="button" className="admin-button" onClick={() => setSettingsOpen(false)}>Done</button></div></section></div>}
  </div>;
}
