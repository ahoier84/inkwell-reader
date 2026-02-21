# 📰 Inkwell — Clean Article Reader

A self-hosted web app that pulls articles from any website and RSS feed, strips out ads and clutter, and presents them in a beautiful reading view.

## Features
- **Article Reader**: Paste any URL and get a clean, ad-free reading view (Mozilla Readability — same engine as Firefox Reader Mode)
- **RSS Feeds**: Add RSS/Atom feed sources, browse headlines, and open articles cleanly
- **Bookmarks**: Save articles to read later, with unread tracking
- **Persistent Storage**: SQLite database keeps your sources and bookmarks across restarts

## Local Development

```bash
npm run install:all     # install both frontend + backend deps
npm run dev:backend     # start API on :3001
npm run dev:frontend    # start React on :3000 (new terminal)
```

## Deploy to Render.com (free tier)

1. Push this repo to GitHub
2. Go to render.com → New → Blueprint
3. Connect your repo — Render will detect `render.yaml` automatically
4. Update `REACT_APP_API_URL` in `render.yaml` with your API service URL after first deploy

## Starter RSS Feeds

| Source | RSS URL |
|--------|---------|
| The Verge | `https://www.theverge.com/rss/index.xml` |
| Ars Technica | `https://feeds.arstechnica.com/arstechnica/index` |
| Hacker News | `https://news.ycombinator.com/rss` |
| BBC News | `http://feeds.bbci.co.uk/news/rss.xml` |

## Tech Stack
- **Backend**: Node.js + Express + SQLite (better-sqlite3)
- **Article Parsing**: @mozilla/readability + jsdom
- **RSS Parsing**: rss-parser
- **Frontend**: React with editorial dark theme
