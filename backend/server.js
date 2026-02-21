const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const RSSParser = require('rss-parser');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const parser = new RSSParser();

// Init SQLite DB
const db = new Database(path.join(__dirname, 'reader.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    title TEXT,
    excerpt TEXT,
    source_name TEXT,
    saved_at TEXT DEFAULT (datetime('now')),
    read INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT DEFAULT 'rss',
    added_at TEXT DEFAULT (datetime('now'))
  );
`);

app.use(cors());
app.use(express.json());

// --- Article Fetch + Parse ---
app.post('/api/article', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ReaderApp/1.0)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      timeout: 15000
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (!article) throw new Error('Could not parse article');
    res.json({
      title: article.title,
      byline: article.byline,
      content: article.content,
      excerpt: article.excerpt,
      siteName: article.siteName,
      length: article.length,
      url
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- RSS Feed Parse ---
app.post('/api/feed', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  try {
    const feed = await parser.parseURL(url);
    res.json({
      title: feed.title,
      description: feed.description,
      link: feed.link,
      items: (feed.items || []).slice(0, 30).map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        creator: item.creator,
        contentSnippet: item.contentSnippet,
        categories: item.categories
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Sources CRUD ---
app.get('/api/sources', (req, res) => {
  const sources = db.prepare('SELECT * FROM sources ORDER BY added_at DESC').all();
  res.json(sources);
});

app.post('/api/sources', (req, res) => {
  const { name, url, type } = req.body;
  if (!name || !url) return res.status(400).json({ error: 'Name and URL required' });
  const result = db.prepare('INSERT INTO sources (name, url, type) VALUES (?, ?, ?)').run(name, url, type || 'rss');
  res.json({ id: result.lastInsertRowid, name, url, type });
});

app.delete('/api/sources/:id', (req, res) => {
  db.prepare('DELETE FROM sources WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// --- Bookmarks CRUD ---
app.get('/api/bookmarks', (req, res) => {
  const bookmarks = db.prepare('SELECT * FROM bookmarks ORDER BY saved_at DESC').all();
  res.json(bookmarks);
});

app.post('/api/bookmarks', (req, res) => {
  const { url, title, excerpt, source_name } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  const exists = db.prepare('SELECT id FROM bookmarks WHERE url = ?').get(url);
  if (exists) return res.status(409).json({ error: 'Already bookmarked' });
  const result = db.prepare('INSERT INTO bookmarks (url, title, excerpt, source_name) VALUES (?, ?, ?, ?)').run(url, title, excerpt, source_name);
  res.json({ id: result.lastInsertRowid });
});

app.patch('/api/bookmarks/:id/read', (req, res) => {
  db.prepare('UPDATE bookmarks SET read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.delete('/api/bookmarks/:id', (req, res) => {
  db.prepare('DELETE FROM bookmarks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Reader API running on port ${PORT}`));
