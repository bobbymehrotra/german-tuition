# BoloGerman — Project Guide for Claude

## What this is
Static marketing website for **BoloGerman** (https://bologerman.com), an online German
exam-prep coaching business. Run by **Bobby Mehrotra** — MBA from a German university,
lived/worked in Germany ~10 years, 10+ years teaching. Classes are fully online across
India, small batches, focused exclusively on **Goethe and telc** exam prep (A1–B2).

The site's job is lead generation: rank in search for German-exam-prep queries (especially
India-focused), then convert visitors via the contact form.

## Tech & deployment
- Plain **static site**: HTML + CSS + vanilla JS. No framework, no build step.
- Hosted on **GitHub Pages**, repo `bobbymehrotra/german-tuition`, custom domain via `CNAME` (`bologerman.com`).
- **Deploy = commit + push to `origin/main`.** GitHub Pages publishes automatically. There is no other build/deploy.
- Contact form (`contact.js`) is wired to submit to Google Sheets. Reviews pull from `google-reviews.json` via `google-reviews.js`.

## URL conventions — important
- Uses **clean URLs, no `.html`**. Pages live as `folder/index.html` and are linked as `/folder/`.
  - Courses: `/courses/a1-german-exam-prep/` (a1, a2, b1, b2)
  - Blog posts: `/blog/<slug>/`
  - Contact: `/contact/`
- Internal links must point to clean URLs (e.g. `/courses/b1-german-exam-prep/`), **never** `*.html`.
- Old `.html` paths redirect via meta-refresh — don't reintroduce `.html` links.
- Course-page asset paths are two levels deep, so use `../../styles.css` etc. from inside `/courses/<x>/` and `/blog/<x>/`.

## When adding or renaming a page — checklist
1. Create `folder/index.html` with correct relative asset paths (`../../...`).
2. Add the clean URL to **`sitemap.xml`** (with today's `lastmod`).
3. If it's content an LLM/AI search should know about, update **`llm.txt`**.
4. Add internal links from relevant pages (homepage, blog index, course index).
5. Keep `robots.txt` allowing the path.
6. Commit + push.

## SEO is the core workload
Most work here is SEO + content. Prefer the installed **marketing** plugin skills over
ad-hoc work:
- `seo-audit` — on-page analysis, keyword/content gaps (replaces hand-written audit docs).
- `draft-content` / `content-creation` — new blog posts; match the existing blog tone and structure.
- `competitive-brief` — vs other Goethe/telc prep providers.
- `design:accessibility-review` — verify the a11y claims in README.

Audience skews **India-based students** pursuing: Au Pair / family-reunification visas (A1),
Ausbildung (A2/B1), citizenship and job-seeker visas (B1), university/work (B2). Lean into
those intent keywords.

## Connected data
- **Search Console data lives in `seo-data/`** as CSV exports (Queries, Pages, Countries,
  Dates) that Bobby drops in manually. This is the primary SEO data source — real queries,
  impressions, clicks, position. The `seo-planner` reads it before proposing changes; don't
  audit blind from HTML alone. Refresh instructions in `seo-data/README.md`. CSVs are
  git-ignored (not part of the deployed site).
- No paid SEO connector is wired up (Supermetrics needs a paid account; skipped). Ahrefs is
  installed but unauthenticated — connect it if/when competitor + keyword-volume data is needed.
- **Bing Webmaster Tools** — `bologerman.com` is verified there. Bing matters less for raw
  traffic (Google ~98%+ in India) but its index powers **ChatGPT search, Copilot, and
  DuckDuckGo**, so it's the main lever for AI-assistant visibility — ties into the `llm.txt`
  strategy. Optional Bing performance exports go in `seo-data/` named `bing_*.csv`; the planner
  reads them and labels findings by engine.
- **IndexNow** is wired up: key file `0aad0f2ac35b793bbc2efd587d2c0810.txt` lives at the site
  root (served at `bologerman.com/<key>.txt`), and `.github/workflows/indexnow.yml` POSTs every
  URL in `sitemap.xml` to `api.indexnow.org` on each push to `main`. This propagates to Bing
  (and onward to ChatGPT search/Copilot/DuckDuckGo). When adding a page, just make sure it's in
  `sitemap.xml` (per the checklist above) — the workflow handles notification automatically.

## Style / voice
- Professional but warm, student-facing, India-aware.
- Emphasize: small online batches, mock tests, exam strategy, founder's German experience.
- Don't invent credentials, fees, or success stats — confirm with Bobby.

## Automation — subagents & scheduled work
Custom subagents live in `.claude/agents/` with tiered models (cost control: the cheap model
does the bulk mechanical work, the better model plans and reviews):
- `seo-planner` (Sonnet) — reads GSC/Ahrefs + the site, decides the ONE highest-value action. Plans only, no edits.
- `content-implementer` (Haiku) — executes the work order: builds the page, runs the add-a-page checklist. Mechanical, no judgment, never pushes to `main`.
- `seo-reviewer` (Sonnet) — verifies links/paths/SEO tags/a11y/checklist before anything ships.

Use them for high-volume mechanical work (e.g. generating several pages). For small one-off
edits, just do the work inline — spawning cold subagents costs more than it saves.

**Publish gate:** Changes can be committed and pushed directly to `main`. No draft branch required unless Bobby specifically asks for a review branch. Automated and manual runs alike may push to `main`.

A weekly scheduled task (`bologerman-weekly-seo-pulse`, Mondays 7am) orchestrates the three
agents, commits one improvement directly to `main`, and messages a summary. Manage it in the app's "Scheduled" sidebar; "Run now" once to pre-approve connector
permissions.

## Housekeeping
- Stray files safe to ignore/clean: `lu46dg3yu.tmp`, `.~lock.*#` (LibreOffice lock).
- SEO audit deliverables (`BoloGerman_SEO_*.docx/pdf`) are generated reports, not site assets.
