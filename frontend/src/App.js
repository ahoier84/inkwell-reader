import { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_API_URL || '';

function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  return [toast, show];
}

async function fetchArticle(url) {
  const r = await fetch(`${API}/api/article`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Failed to fetch article');
  return d;
}

async function fetchFeed(url) {
  const r = await fetch(`${API}/api/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Failed to fetch feed');
  return d;
}

function Toast({ toast }) {
  if (!toast) return null;
  return <div className={`toast ${toast.type}`}>{toast.msg}</div>;
}

function Spinner() { return <span className="spinner" />; }

function EmptyState({ icon, title, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-glyph">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-sub">{sub}</div>
    </div>
  );
}

function ArticleListItem({ item, active, onClick }) {
  return (
    <div className={`article-list-item ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="article-list-content">
        <div className="article-list-title">{item.title || 'Untitled'}</div>
        {item.excerpt && <div className="article-list-excerpt">{item.contentSnippet || item.excerpt}</div>}
        <div className="article-list-meta">
          {item.sourceName && <span className="source">{item.sourceName}</span>}
          {item.creator && <span>{item.creator}</span>}
          {item.pubDate && <span>{new Date(item.pubDate).toLocaleDateString()}</span>}
        </div>
      </div>
    </div>
  );
}

function ReaderView({ article, url, onBack, onBookmark, isBookmarked }) {
  const domain = (() => { try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; } })();
  return (
    <div className="reader-pane">
      <div className="reader-inner">
        <button className="reader-back" onClick={onBack}>← Back to list</button>
        {article.siteName && <div className="reader-source-badge">{article.siteName}</div>}
        <h1 className="reader-title">{article.title}</h1>
        <div className="reader-meta">
          {article.byline && <span>{article.byline}</span>}
          {domain && <a href={url} target="_blank" rel="noreferrer">↗ {domain}</a>}
          {article.length && <span>~{Math.ceil(article.length / 1000)}k chars</span>}
        </div>
        <div className="reader-actions">
          <button className={`btn ${isBookmarked ? 'btn-ghost' : 'btn-primary'}`} onClick={onBookmark}>
            {isBookmarked ? '✓ Bookmarked' : '＋ Bookmark'}
          </button>
          <a className="btn btn-ghost" href={url} target="_blank" rel="noreferrer">View Original ↗</a>
        </div>
        <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }} />
      </div>
    </div>
  );
}

function SourcesPanel({ sources, activeSrc, onSelectSource, onDeleteSource, onAddSource }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) return;
    setLoading(true);
    try { await onAddSource(name.trim(), url.trim()); setName(''); setUrl(''); }
    finally { setLoading(false); }
  };
  return (
    <>
      <div className="sidebar-section">
        <div className="section-label">Your Sources</div>
        {sources.length === 0 && <div style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>No sources yet</div>}
        {sources.map(src => (
          <div key={src.id} className={`source-item ${activeSrc?.id === src.id ? 'active' : ''}`} onClick={() => onSelectSource(src)}>
            <div className="source-dot" />
            <div className="source-name">{src.name}</div>
            <button className="source-delete" onClick={e => { e.stopPropagation(); onDeleteSource(src.id); }} title="Remove">×</button>
          </div>
        ))}
      </div>
      <div className="add-source-form">
        <div className="section-label">Add RSS Source</div>
        <input placeholder="Display name" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="https://example.com/feed" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <button className="btn btn-primary" onClick={handleAdd} disabled={loading || !name || !url}>
          {loading ? 'Adding…' : 'Add Source'}
        </button>
      </div>
    </>
  );
}

function BookmarksPanel({ bookmarks, onSelectBookmark, onDeleteBookmark, activeUrl }) {
  if (bookmarks.length === 0) {
    return (
      <div className="sidebar-section">
        <div className="section-label">Saved Articles</div>
        <div style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>No bookmarks yet</div>
      </div>
    );
  }
  return (
    <div className="sidebar-section">
      <div className="section-label">Saved Articles</div>
      {bookmarks.map(bm => (
        <div key={bm.id} className={`feed-item ${activeUrl === bm.url ? 'active' : ''}`} onClick={() => onSelectBookmark(bm)} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div className="feed-item-title">{bm.title || bm.url}</div>
            <div className="feed-item-meta">
              <span className="feed-item-source">{bm.source_name || 'Saved'}</span>
              <span>{new Date(bm.saved_at).toLocaleDateString()}</span>
              {!bm.read && <span className="badge unread">NEW</span>}
            </div>
          </div>
          <button onClick={e => { e.stopPropagation(); onDeleteBookmark(bm.id); }} style={{ color: 'var(--text-dim)', fontSize: '0.8rem', padding: '0 0.2rem', opacity: 0 }} className="source-delete">×</button>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('feeds');
  const [sources, setSources] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [activeSrc, setActiveSrc] = useState(null);
  const [feedItems, setFeedItems] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [article, setArticle] = useState(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [toast, showToast] = useToast();

  const loadSources = useCallback(async () => {
    try { const r = await fetch(`${API}/api/sources`); setSources(await r.json()); } catch {}
  }, []);

  const loadBookmarks = useCallback(async () => {
    try { const r = await fetch(`${API}/api/bookmarks`); setBookmarks(await r.json()); } catch {}
  }, []);

  useEffect(() => { loadSources(); loadBookmarks(); }, [loadSources, loadBookmarks]);

  const handleSelectSource = async (src) => {
    setActiveSrc(src); setFeedItems([]); setSelectedItem(null); setArticle(null); setFeedLoading(true);
    try {
      const feed = await fetchFeed(src.url);
      setFeedItems(feed.items.map(i => ({ ...i, sourceName: src.name })));
    } catch (e) { showToast(`Feed error: ${e.message}`, 'error'); }
    finally { setFeedLoading(false); }
  };

  const openArticle = async (url, meta = {}) => {
    setSelectedItem({ url, ...meta }); setArticle(null); setArticleLoading(true);
    try { const a = await fetchArticle(url); setArticle(a); }
    catch (e) { showToast(`Article error: ${e.message}`, 'error'); }
    finally { setArticleLoading(false); }
  };

  const handleBookmarkClick = async (bm) => {
    openArticle(bm.url, { title: bm.title, sourceName: bm.source_name });
    if (!bm.read) {
      await fetch(`${API}/api/bookmarks/${bm.id}/read`, { method: 'PATCH' });
      loadBookmarks();
    }
  };

  const handleUrlLoad = async () => {
    let url = urlInput.trim();
    if (!url) return;
    if (!url.startsWith('http')) url = 'https://' + url;
    setActiveSrc(null); setFeedItems([]);
    await openArticle(url, { title: '', sourceName: '' });
  };

  const handleBookmark = async () => {
    if (!selectedItem || !article) return;
    try {
      const r = await fetch(`${API}/api/bookmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: selectedItem.url, title: article.title, excerpt: article.excerpt, source_name: selectedItem.sourceName || article.siteName })
      });
      if (r.status === 409) { showToast('Already bookmarked', 'error'); return; }
      if (!r.ok) throw new Error();
      showToast('Bookmarked!'); loadBookmarks();
    } catch { showToast('Failed to bookmark', 'error'); }
  };

  const handleDeleteBookmark = async (id) => {
    await fetch(`${API}/api/bookmarks/${id}`, { method: 'DELETE' });
    loadBookmarks(); showToast('Removed');
  };

  const handleAddSource = async (name, url) => {
    const r = await fetch(`${API}/api/sources`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url, type: 'rss' })
    });
    if (!r.ok) { showToast('Failed to add source', 'error'); return; }
    showToast(`Added ${name}`); loadSources();
  };

  const handleDeleteSource = async (id) => {
    await fetch(`${API}/api/sources/${id}`, { method: 'DELETE' });
    if (activeSrc?.id === id) { setActiveSrc(null); setFeedItems([]); }
    loadSources();
  };

  const isBookmarked = selectedItem && bookmarks.some(b => b.url === selectedItem.url);

  const renderMain = () => {
    if (articleLoading) return <div className="loading-overlay"><Spinner /><span>Fetching article…</span></div>;
    if (article && selectedItem) return <ReaderView article={article} url={selectedItem.url} onBack={() => { setArticle(null); setSelectedItem(null); }} onBookmark={handleBookmark} isBookmarked={isBookmarked} />;
    if (feedLoading) return <div className="loading-overlay"><Spinner /><span>Loading feed…</span></div>;
    if (feedItems.length > 0) return (
      <div className="article-list">
        {feedItems.map((item, i) => <ArticleListItem key={i} item={item} active={selectedItem?.url === item.link} onClick={() => openArticle(item.link, { title: item.title, sourceName: item.sourceName })} />)}
      </div>
    );
    if (tab === 'bookmarks' && bookmarks.length > 0) return (
      <div className="article-list">
        {bookmarks.map(bm => <ArticleListItem key={bm.id} item={{ title: bm.title, excerpt: bm.excerpt, pubDate: bm.saved_at, sourceName: bm.source_name, link: bm.url }} active={selectedItem?.url === bm.url} onClick={() => handleBookmarkClick(bm)} />)}
      </div>
    );
    return <EmptyState icon="📰" title={tab === 'bookmarks' ? 'No bookmarks yet' : 'Nothing to read'} sub={tab === 'bookmarks' ? 'Save articles while reading to find them here' : 'Select a source from the sidebar or paste a URL above'} />;
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">Ink<span>well</span></div>
          <div className="sidebar-subtitle">Clean Reader</div>
        </div>
        <div className="sidebar-nav">
          <button className={tab === 'feeds' ? 'active' : ''} onClick={() => setTab('feeds')}>Feeds</button>
          <button className={tab === 'bookmarks' ? 'active' : ''} onClick={() => setTab('bookmarks')}>
            Saved {bookmarks.filter(b => !b.read).length > 0 && <span className="badge unread" style={{ marginLeft: '0.3rem' }}>{bookmarks.filter(b => !b.read).length}</span>}
          </button>
        </div>
        {tab === 'feeds' ? (
          <SourcesPanel sources={sources} activeSrc={activeSrc} onSelectSource={handleSelectSource} onDeleteSource={handleDeleteSource} onAddSource={handleAddSource} />
        ) : (
          <BookmarksPanel bookmarks={bookmarks} onSelectBookmark={handleBookmarkClick} onDeleteBookmark={handleDeleteBookmark} activeUrl={selectedItem?.url} />
        )}
      </aside>
      <div className="main">
        <div className="topbar">
          <div className="url-input-row">
            <input placeholder="Paste any article URL to read it cleanly…" value={urlInput} onChange={e => setUrlInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUrlLoad()} />
            <button className="btn btn-primary" onClick={handleUrlLoad} disabled={!urlInput.trim()}>Load</button>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {renderMain()}
        </div>
      </div>
      <Toast toast={toast} />
    </div>
  );
}
