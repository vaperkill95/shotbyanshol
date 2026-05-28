# ShotByAnshol

Portfolio site for Anshol — photography and video. Next.js 16, Tailwind v4, deployed on Vercel.

## Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4
- **Fonts:** Fraunces (display) + Geist (body), via next/font
- **Database:** Neon (Postgres) — Phase 2
- **ORM:** Drizzle — Phase 2
- **Storage:** Cloudflare R2 (photos + videos) — Phase 3
- **Email:** Resend (contact form) — Phase 4
- **Auth:** Better Auth (admin login) — Phase 5
- **Video:** Vimeo embeds
- **Hosting:** Vercel

## Local setup

In VS Code, open this folder, terminal set to Command Prompt:

```cmd
npm install
npm run dev
```

Opens at http://localhost:3000. You should see "ShotByAnshol." on a near-black page in a serif display font.

Build for production (what Vercel runs):

```cmd
npm run build
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in as each phase needs.
Phase 1 needs none — the site runs without any keys.

## Deploy (Vercel)

1. Push this folder to a GitHub repo named `shotbyanshol`.
2. In Vercel: New Project -> Import the repo. Vercel auto-detects Next.js.
3. Click Deploy. You get a live URL in ~1 minute.
4. Every future `git push` auto-deploys.

## Build phases

- [x] **Phase 1 — Scaffold + deploy.** Next.js + Tailwind + fonts, live on Vercel. _You are here._
- [ ] **Phase 2 — Database.** Neon + Drizzle schema (categories, photos, videos, bookings, site_settings).
- [ ] **Phase 3 — Public gallery.** Atmospheric grid, lightbox, photo/video filter, show-count dropdown. About page. Reads real data from Neon + R2.
- [ ] **Phase 4 — Contact.** Form saves to DB and emails Anshol via Resend.
- [ ] **Phase 5 — Admin auth.** Better Auth, login page, protected /admin routes.
- [ ] **Phase 6 — Admin portal.** Manage photos, videos, categories, bookings, and site settings (site name, bio, contact email, booking status).
- [ ] **Phase 7 — Polish + launch.** SEO, image optimization, mobile pass, custom domain.

## Project structure

```
shotbyanshol/
├── app/
│   ├── layout.tsx       Root layout, fonts, metadata
│   ├── page.tsx         Landing (placeholder -> full gallery in Phase 3)
│   └── globals.css      Tailwind v4 import + theme tokens + base styles
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── package.json
├── .env.example
└── .gitignore
```
