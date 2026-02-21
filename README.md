# Inkwell — Clean Article Reader

A self-hosted, ad-free article reader with RSS feeds and bookmarking. Built with React + Netlify Functions + Supabase.

## Stack

- **Frontend**: React (hosted on Netlify, free)
- **Functions**: Netlify Functions (serverless API, free tier: 125k requests/month)
- **Database**: Supabase Postgres (free tier: 500MB)

---

## Deploy to Netlify + Supabase (Free)

### Step 1: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a **New Project** (free tier)
3. Once the project is ready, go to **SQL Editor** and run:

```sql
CREATE TABLE sources (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT DEFAULT 'rss',
  added_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE bookmarks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  excerpt TEXT,
  source_name TEXT,
  saved_at TIMESTAMPTZ DEFAULT now(),
  read BOOLEAN DEFAULT false
);
```

4. Go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`

### Step 2: Deploy to Netlify

1. Push this repo to GitHub (already done at `github.com/ahoier84/inkwell-reader` — push this new version)
2. Go to [netlify.com](https://netlify.com) → **Add new site → Import from Git**
3. Connect GitHub, select `inkwell-reader`
4. Netlify will auto-detect the `netlify.toml` settings:
   - **Base directory**: `src`
   - **Build command**: `npm run build`
   - **Publish directory**: `src/build`
   - **Functions directory**: `netlify/functions`
5. Before deploying, go to **Site settings → Environment variables** and add:
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_ANON_KEY` = your Supabase anon key
6. Click **Deploy site** — done!

---

## Starter RSS Feeds

Add these in the app after deployment:

| Name | URL |
|------|-----|
| The Verge | `https://www.theverge.com/rss/index.xml` |
| Ars Technica | `https://feeds.arstechnica.com/arstechnica/index` |
| Hacker News | `https://news.ycombinator.com/rss` |
| BBC News | `https://feeds.bbci.co.uk/news/rss.xml` |

---

## Local Development

```bash
# Install dependencies
npm install
cd netlify/functions && npm install && cd ../..
cd src && npm install && cd ..

# Set env vars
cp .env.example .env.local
# Fill in SUPABASE_URL and SUPABASE_ANON_KEY

# Run locally (requires netlify-cli)
npx netlify dev
```
