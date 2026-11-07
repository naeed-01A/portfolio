# Naeed Akhtar | Personal Portfolio

Personal site for Naeed Akhtar, who holds master's degrees in Mathematics, Physics and Computer Science and is looking for work as an **Agentic & Robotics AI Trainer**.

Plain HTML, CSS and JavaScript. No build step, no dependencies.

## Features

- **Hero**: the AI-trainer role, a short introduction, two buttons (**Get in touch** and **Download resume**) and an at-a-glance card that lists the three subjects once. Its four numbers are the master's degrees, the disciplines, the research papers reviewed (the number is a link to the papers page) and the highest CGPA.
- **About**: three pillars, one per subject (Mathematics, Physics, Computer Science), each saying what it brings to AI training, plus cards for Agentic AI training and Robotics AI training.
- **Research**: the proposed research direction (Computational and Mathematical Modelling of Complex Physical Systems) with a three-circle diagram and a Model, Validate, Solve flow, one step per subject. It is labelled as a proposed direction.
- **Skills**: one large tab per subject. Each shows how the subject helps in AI training and the learning path from school to master's level, with a link that opens the full topic list in Education.
- **Education**: a summary strip, an expandable timeline from school to the master's degrees with a score ring per stage (CGPA, or percentage and division for Classes XI-XII), topics and subtopics for Mathematics, Physics and Computer Science at every stage (with the syllabus they follow), an "Expand all" button and a CGPA chart. Every stage links to the institution's website.
- **Research papers reviewed** (`papers.html`, served at `/papers`): the list of 50 papers with year, authors, venue and a link to each paper at its source (DOI, arXiv or conference proceedings). Filter by theme (the four filter tiles double as the summary numbers), search by title, author or year, and sort oldest or newest first. A link card in the Education section and the number in the hero card both lead here.
- **Languages**: English and Hindi (native), Urdu (professional working), Persian (fluent) and Arabic (basic), each in its own script with its level.
- **Find me online**: cards for LinkedIn, X, GitHub, HackerRank, Kaggle and LeetCode, each with the real logo of the platform.
- Dark and light theme, each with its own palette. The first paint follows the visitor's system setting and the choice is remembered.
- Responsive down to 320px wide, 44px touch targets, keyboard accessible (tabs work with the arrow, Home and End keys), respects reduced motion, print-friendly (everything expands when printed).
- Strict Content Security Policy: no inline styles, one hashed inline script, no third-party scripts.

## Run locally

Open `index.html` in a browser, or use the VS Code **Live Server** extension and visit `http://127.0.0.1:5500/`.

## Deploy (Cloudflare)

The site is live at **https://portfolio.naeed.workers.dev/**. Cloudflare builds it from this repository, so every push to `main` redeploys it automatically.

It is served as Cloudflare Workers static assets, configured in `wrangler.jsonc`:

- The repository folder itself is the site (`"directory": "."`). `.assetsignore` lists what must not be published: the README, the config, the Worker, the private folder and git files.
- Unknown addresses show `404.html`, and `_headers` adds the security headers.
- `worker.js` is a tiny Worker that only answers Google's verification address. Cloudflare redirects every `/name.html` to `/name`, but Google needs its verification file at the exact `.html` address with no redirect. A new `google<hex>.html` file only needs its path added to `run_worker_first` in `wrangler.jsonc`.

## Editing content

Almost everything is data at the top of `assets/app.js`:

| What | Where |
|---|---|
| Stages of education: years, degree, institution, CGPA (or `percent` and `division`), website | `EDU` list, newest first |
| Topics and subtopics of every stage | `topics` inside each `EDU` entry (see below) |
| Where a topic list comes from | `basis` inside each `EDU` entry |
| Subject names, colours and the "In AI training" sentence | `FIELDS` |
| Profile links (LinkedIn, X, GitHub, HackerRank, Kaggle, LeetCode) | `PROFILES` list; each entry points to its logo file in `assets/icons/`. Also update `sameAs` in the structured data in `index.html` and the profile chips in the resume template |
| Research papers reviewed (title, authors, venue, link, theme) | `assets/papers-data.js`, one line per paper in the order shown (oldest first); the paper number is its position. The count on the home page and on the papers page comes from this list. Themes (`phys`, `reason`, `agents`, `emotion`) and their colours are defined in `assets/papers.js` |

A topic area is a list whose first item is the area name and whose other items are its subtopics:

```js
topics: {
  math: [ ["Algebra", "groups", "rings", "fields"], ["Topology", "compactness", "connectedness"] ],
  phys: [ ... ],
  cs:   [ ... ]
}
```

The timeline, CGPA chart, skill tabs, topic counts, the numbers in the hero card and the "Master's" lines in About are all drawn from `EDU`, so one change updates every place. Page text (hero, About, Research, languages, contact) is in `index.html`. Sections for projects and publications are left out until there is something to show; add them as new `<section>` blocks in `index.html` (and a nav link).

The topic lists follow the published syllabus of each programme (CBSE for Classes XI-XII; the University of Delhi B.Sc. Physical Sciences course contents effective 2010-11; the University of Rajasthan M.A./M.Sc. Mathematics syllabus; the University of Delhi M.Sc. Computer Science course contents; the Jamia Millia Islamia M.Sc. Physics syllabus). Trim or add topics so they match what was actually studied.

The resume is `assets/Naeed_Akhtar_Resume.pdf`. It is a two-page A4 PDF built from `private-resume/resume/template.html`, which stays on this computer only (it is git-ignored). To update it, edit that template and run `python private-resume/resume/build.py` (it inlines the real logo files from `private-resume/resume/icons/`, prints the PDF with Microsoft Edge), then copy the resulting `Naeed_Akhtar_Resume.pdf` to `assets/`. Or simply replace the PDF with another file of the same name. The share-preview image works the same way (`private-resume/og-image.html` to `assets/og-image.png`, 1200x630).

To change the inline script in `index.html` (the small one in `<head>`), recompute its SHA-256 and update the `script-src` hash in `_headers`, otherwise the browser will block it.

## Search and sharing

- `index.html` carries the canonical address, share-preview tags (`og:*`, `twitter:*`) and structured data (`Person`).
- `sitemap.xml` lists the home page and the papers page, and the `Sitemap:` line in `robots.txt` points search engines to it. `papers.html` has its own canonical address and share-preview tags and reuses the same hashed inline theme script as `index.html`, so no change to `_headers` is needed.
- `google32ac2f810cdaa9e8.html` and `googlec8e965a58b9d3a68.html` are Google Search Console ownership files (one per verified address). Keep them, otherwise the site becomes unverified. Both paths are listed in `run_worker_first` in `wrangler.jsonc`.
- If the site moves to another address (for example a custom domain), update the address in `index.html` (canonical, `og:url`, `og:image`, `twitter:image` and the structured data `url`), `sitemap.xml` and `robots.txt`, then verify the new address in Search Console.
- Web analytics is not set up.

## Structure

```
index.html            page content
papers.html           research papers reviewed (served at /papers)
assets/style.css      styles (light and dark tokens, components, papers page)
assets/app.js         content data, rendering and interactivity
assets/papers-data.js the list of papers (used by the papers page and for the count on the home page)
assets/papers.js      rendering, filter, search and sort of the papers page
assets/logo.svg       NA monogram with orbit ring (hero card, 404, share preview)
assets/logo-small.svg simplified monogram for tiny sizes (header; favicon.svg is the same file)
assets/icons/         real logos of LinkedIn, X, GitHub, HackerRank, Kaggle and LeetCode (Simple Icons, CC0; only the colour is set)
assets/404.css        layout of the not-found page
assets/Naeed_Akhtar_Resume.pdf  resume (download button in the hero)
assets/og-image.png   1200x630 share-preview image
404.html              not-found page
_headers              security headers
robots.txt            crawler rules and sitemap address
sitemap.xml           sitemap (home page and papers page)
wrangler.jsonc        Cloudflare deployment config
.assetsignore         files that are not published
worker.js             answers Google's verification address without a redirect
google32ac2f810cdaa9e8.html  Google Search Console ownership files
googlec8e965a58b9d3a68.html
private-resume/       editable sources for the resume and the share image (git-ignored, never published)
```
