# Nhimbe

*Nhimbe* (Shona) is a communal work party, where neighbours gather to finish a job together. This is our in-house ticketing system: projects, tickets, comments and a full change history. Nothing else.

**Stack:** Next.js 16 (App Router, TypeScript) · Postgres on Neon · Drizzle ORM · Auth.js (email + password) · Tailwind CSS v4 · shadcn/ui · lucide icons. It deploys to Vercel.

---

## Features

- **Roles.** Developers create, edit, comment on and assign tickets. Admins can also manage users and projects.
- **Dashboard.** Shows your open tickets, unassigned tickets, recently updated tickets and counts per status.
- **Ticket list.** Filter by status, priority, type, project and assignee, search title and description, sort, and page through results. Every view lives in the URL, so you can share it.
- **Ticket detail.** Edit fields inline. Descriptions and comments use Markdown (sanitised). There's a history timeline, and quick status and assignee changes.
- **Keyboard.** <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> opens the command palette (jump to `PAY-12`, search, create). <kbd>C</kbd> opens a new ticket.
- **Themes.** Light, dark or follow the system, with a sandstone, msasa-green and terracotta palette.

---

## Local setup

**Prerequisites:** Node.js 20.9 or newer, npm, and a Postgres database. The simplest option is a free [Neon](https://neon.tech) project, which is what production uses.

```bash
git clone <repo-url> nhimbe && cd nhimbe
npm install

cp .env.example .env.local
# Edit .env.local: set DATABASE_URL and AUTH_SECRET (see below)

npm run db:migrate   # create the schema
npm run db:seed      # 1 admin, 3 developers, 2 projects, 25 tickets
npm run dev          # http://localhost:3000
```

Sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from your `.env.local`. The seeded developers are `chipo@nhimbe.local`, `farai@nhimbe.local` and `tatenda@nhimbe.local`, with the password `SEED_DEV_PASSWORD` (default `nhimbe-dev-2026`).

> **Tip:** If the project is already linked to Vercel, `npx vercel env pull .env.local` fetches the database URLs for you.

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string. Use Neon's **pooled** URL (host contains `-pooler`). Vercel sets this when you connect the Neon integration. |
| `DATABASE_URL_UNPOOLED` | no | Direct (non-pooled) URL, used by migrations when present. Vercel's Neon integration sets it. |
| `AUTH_SECRET` | yes | Encrypts the session cookie. Generate it with `npx auth secret` or `openssl rand -base64 32`. Use a different value per environment. |
| `AUTH_URL` | no | Only needed when self-hosting behind a proxy. Auth.js infers it on Vercel. |
| `SEED_ADMIN_EMAIL` | for seeding | Email address of the first admin account. |
| `SEED_ADMIN_PASSWORD` | for seeding | Password for that admin. Change it after first sign-in in production. |
| `SEED_DEV_PASSWORD` | no | Password for the three demo developers (default `nhimbe-dev-2026`). |

All secrets live in environment variables. `.env*` files are git-ignored except `.env.example`.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm run db:generate` | Create a new SQL migration in `drizzle/` after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Seed demo data (`-- --reset` wipes tickets, comments and history first) |
| `npm run db:studio` | Browse the database with Drizzle Studio |

Migrations are versioned SQL files in [`drizzle/`](drizzle/). Commit them. Never edit a migration that has already been applied; generate a new one instead.

---

## Deploying to Vercel

1. **Push the repo** to GitHub, GitLab or Bitbucket.
2. **Import the project.** In the [Vercel dashboard](https://vercel.com/new), choose **Add New → Project** and import the repo. Vercel detects Next.js, so leave the build settings as they are. Don't deploy yet; if you already did, that's fine, the first deploy will just fail to reach the database.
3. **Attach the database.** Open the project and go to **Storage → Create Database** (or **Browse Marketplace**). Pick **Neon** (Serverless Postgres) and choose a region close to your Vercel functions, such as `fra1`/Frankfurt for teams in Southern Africa and Europe. Create it, then **Connect** it to this project for all environments. Vercel adds `DATABASE_URL`, `DATABASE_URL_UNPOOLED` and related variables automatically.
4. **Add the auth secret.** Under **Settings → Environment Variables**, add `AUTH_SECRET` (generate a fresh one) for Production, and separate values for Preview and Development if you use them.
5. **Run the migrations once** from your machine. Copy the production `DATABASE_URL_UNPOOLED` (or `DATABASE_URL`) from **Storage → your database → .env.local** tab, then run:
   ```bash
   DATABASE_URL="postgresql://…production…" npm run db:migrate
   ```
   Variables set on the command line take precedence over `.env.local`, so your local settings stay untouched.
   *Optional:* to apply migrations on every deploy, set **Settings → Build & Development → Build Command** to `npm run db:migrate && npm run build`.
6. **Create the first admin.**
   ```bash
   DATABASE_URL="postgresql://…production…" \
   SEED_ADMIN_EMAIL="you@yourcompany.com" SEED_ADMIN_PASSWORD="a-long-unique-password" \
   npm run db:seed
   ```
   This also creates the demo developers, projects and tickets. If you want a clean production database, deactivate the demo users and archive the demo projects afterwards from the Admin pages.
7. **Deploy.** Trigger a deploy (push to `main`, or **Deployments → Redeploy**). Open the URL, sign in, and change the admin password under **Admin → Users**.

---

## How it works

```
src/
  app/(auth)/login        sign-in page
  app/(app)/              signed-in area (layout checks the session)
    page.tsx              dashboard
    tickets/              list · new · [key] detail · [key]/edit
    admin/                users · projects (layout checks the admin role)
  actions/                server actions: check session → validate (Zod) → service → revalidate
  server/                 data access with Drizzle (server-only)
  db/schema.ts            tables, enums and indexes; migrations in /drizzle
  auth.ts, proxy.ts       Auth.js config and optimistic route guard
  components/             UI (shadcn/ui primitives live in components/ui)
```

### Security

- **Sessions.** Auth.js keeps a JWT in an encrypted, HTTP-only, `SameSite=Lax` cookie (`Secure` over HTTPS), valid for 7 days. Every page and server action re-loads the user from the database, so deactivating someone or changing their role takes effect on their next request.
- **Authorisation.** `requireUser()` / `requireAdmin()` guard pages, and `assertUser()` / `assertAdmin()` guard server actions (`src/lib/auth-guards.ts`). The proxy only does an early redirect; it is not the security boundary.
- **Passwords** are hashed with bcrypt (cost 12). Login failures are rate-limited in Postgres (`login_attempts`): 5 per account+IP, 30 per IP, and 20 per account per 15 minutes.
- **Input.** Every action validates its input with Zod. All queries go through Drizzle, so they are parameterised.
- **Markdown** is rendered with `react-markdown`, which ignores raw HTML, and then passed through `rehype-sanitize` (GitHub's allow-list). Links open with `rel="noopener noreferrer nofollow"`.

### Data notes

- Ticket numbers are per project (`PAY-1`, `PAY-2`, …). New numbers are allocated inside a transaction that locks the project row, and a unique index on `(project_id, number)` backs this up.
- Every edit to a ticket field writes one `ticket_history` row (`field`, `old_value`, `new_value`). `closed_at` is set when a ticket enters *Done* or *Closed* and cleared if it is reopened. Any status can move to any other.
- A ticket's project, and so its key, is fixed once the ticket is created. Archived projects keep their tickets but stop accepting new ones.
- Text search uses `ILIKE`, backed by `pg_trgm` GIN indexes. That's plenty for a team-sized backlog.
- Cache Components is turned off: every page is per-user and rendered on request.
