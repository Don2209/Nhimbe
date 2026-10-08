/**
 * Seeds a fresh database with a small, realistic team and backlog.
 *
 *   npm run db:seed            # create users/projects; add tickets if none exist
 *   npm run db:seed -- --reset # wipe tickets, comments and history first
 *
 * Users and projects are upserted by email/key, so re-running is safe.
 */
import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });

type Status = "open" | "in_progress" | "in_review" | "done" | "closed";
type Seat = "admin" | "chipo" | "farai" | "tatenda";

type SeedTicket = {
  title: string;
  type: "bug" | "task" | "feature" | "support";
  priority: "low" | "medium" | "high" | "urgent";
  status: Status;
  assignee: Seat | null;
  reporter: Seat;
  daysAgo: number;
  dueInDays?: number;
  description: string;
  comments?: [Seat, string][];
};

const PEOPLE: Record<Seat, { name: string; email: string; role: "admin" | "developer" }> = {
  admin: { name: "Tendai Moyo", email: "", role: "admin" }, // email from SEED_ADMIN_EMAIL
  chipo: { name: "Chipo Mapfumo", email: "chipo@nhimbe.local", role: "developer" },
  farai: { name: "Farai Ndlovu", email: "farai@nhimbe.local", role: "developer" },
  tatenda: { name: "Tatenda Sibanda", email: "tatenda@nhimbe.local", role: "developer" },
};

const PROJECTS = [
  { key: "PAY", name: "Payments" },
  { key: "WEB", name: "Customer portal" },
] as const;

const TICKETS: Record<(typeof PROJECTS)[number]["key"], SeedTicket[]> = {
  PAY: [
    {
      title: "EcoCash callback times out under load",
      type: "bug", priority: "urgent", status: "in_progress", assignee: "farai", reporter: "tatenda", daysAgo: 3, dueInDays: 1,
      description: "During the Friday peak, roughly **4%** of EcoCash payment callbacks returned `504` after 30s.\n\n### Steps to reproduce\n1. Run the load test in `scripts/load/ecocash.js` at 200 rps\n2. Watch the callback handler latency in the dashboard\n\n### Notes\nThe handler does a synchronous ledger write before responding. We should acknowledge first and process on the queue.",
      comments: [
        ["farai", "Confirmed locally. The ledger write holds a row lock on the merchant balance; under contention it queues up behind settlement."],
        ["tatenda", "Merchants are noticing: two support emails this morning. Can we hotfix the ack-first change today?"],
        ["farai", "Yes, PR is up. Moving the write onto the `payments.callbacks` queue and returning `202` immediately."],
      ],
    },
    {
      title: "Add ZiG currency support to invoices",
      type: "feature", priority: "high", status: "open", assignee: "chipo", reporter: "admin", daysAgo: 9, dueInDays: 14,
      description: "Invoices currently support USD only. Add **ZiG** as a first-class currency:\n\n- [ ] Currency column on `invoices` (default `USD`)\n- [ ] Formatting with the correct symbol and two decimals\n- [ ] Exchange rate snapshot stored at invoice time\n- [ ] PDF template update",
    },
    {
      title: "Reconcile duplicate settlements from 3 October",
      type: "support", priority: "high", status: "in_review", assignee: "tatenda", reporter: "admin", daysAgo: 5,
      description: "Finance flagged 17 merchants who received two settlement payouts on 3 Oct. Need a reconciliation report and a plan for clawback.",
      comments: [
        ["tatenda", "Report attached to the finance thread. Root cause is the double job run (see PAY-11). Totals: 17 merchants, $4,212.40."],
        ["admin", "Thanks. Finance will handle clawbacks manually. Please review the SQL with Farai before we close this."],
      ],
    },
    {
      title: "Webhook retries should use exponential backoff",
      type: "task", priority: "medium", status: "open", assignee: null, reporter: "farai", daysAgo: 12,
      description: "We retry failed merchant webhooks every 60s for an hour. Switch to exponential backoff with jitter (1m, 2m, 4m … up to 6h) and cap at 12 attempts.",
    },
    {
      title: "Refund button shows for already-refunded payments",
      type: "bug", priority: "medium", status: "done", assignee: "chipo", reporter: "tatenda", daysAgo: 18,
      description: "On the payment detail page the **Refund** button is still enabled after a full refund. Clicking it returns a 409, but it shouldn't be offered at all.",
      comments: [["chipo", "Fixed: the button now checks `refundable_amount > 0`. Added a test for partial refunds too."]],
    },
    {
      title: "Document the payment status lifecycle",
      type: "task", priority: "low", status: "open", assignee: null, reporter: "chipo", daysAgo: 20,
      description: "New joiners keep asking what `authorised` vs `captured` vs `settled` means. Write a short doc with a state diagram in `docs/payments.md`.",
    },
    {
      title: "Upgrade the payment gateway SDK to v4",
      type: "task", priority: "medium", status: "in_progress", assignee: "farai", reporter: "farai", daysAgo: 7, dueInDays: 10,
      description: "v3 is end-of-life in December. v4 changes the auth flow to signed requests. Upgrade guide: see the gateway docs.\n\n```bash\nnpm i @gateway/sdk@4\n```",
    },
    {
      title: "Card declines show a generic error message",
      type: "bug", priority: "high", status: "open", assignee: null, reporter: "tatenda", daysAgo: 2,
      description: "Customers see \"Something went wrong\" for every decline. Map the gateway decline codes (insufficient funds, expired card, do-not-honour) to friendly messages.",
    },
    {
      title: "Export monthly statements as CSV",
      type: "feature", priority: "medium", status: "in_review", assignee: "tatenda", reporter: "admin", daysAgo: 14,
      description: "Merchants want to import statements into their accounting software. Add a **Download CSV** button next to the PDF export.",
    },
    {
      title: "Rotate the payment gateway API keys",
      type: "task", priority: "urgent", status: "done", assignee: "admin", reporter: "admin", daysAgo: 16,
      description: "Annual key rotation. Update the secrets in Vercel, redeploy, and revoke the old keys after 24h.",
      comments: [["admin", "Rotated and old keys revoked. No errors in the logs."]],
    },
    {
      title: "Daily settlement job ran twice on 3 October",
      type: "bug", priority: "medium", status: "closed", assignee: "farai", reporter: "tatenda", daysAgo: 6,
      description: "The cron fired twice after a deploy overlapped with the schedule. Add an advisory lock so only one run can proceed.",
      comments: [["farai", "Added `pg_try_advisory_lock` around the job. Closing; the reconciliation is tracked in PAY-3."]],
    },
    {
      title: "Merchant asking why their payout was delayed",
      type: "support", priority: "low", status: "closed", assignee: "tatenda", reporter: "tatenda", daysAgo: 11,
      description: "Mbare Hardware asked why Tuesday's payout arrived Thursday. Bank holiday; replied with the settlement calendar.",
    },
    {
      title: "Idempotency keys for payment creation",
      type: "feature", priority: "high", status: "open", assignee: "farai", reporter: "chipo", daysAgo: 4, dueInDays: 21,
      description: "Mobile clients retry on flaky networks and occasionally create duplicate payments. Accept an `Idempotency-Key` header and return the original response for repeats within 24h.",
    },
  ],
  WEB: [
    {
      title: "Login page flashes unstyled on slow connections",
      type: "bug", priority: "medium", status: "open", assignee: "chipo", reporter: "tatenda", daysAgo: 8,
      description: "On throttled 3G the login form renders without styles for ~1s. Probably the font CSS blocking; check `font-display` and preloads.",
    },
    {
      title: "Dark mode for the customer portal",
      type: "feature", priority: "low", status: "open", assignee: null, reporter: "chipo", daysAgo: 21,
      description: "Several customers asked for it. We already use CSS variables, so this is mostly a second palette plus a toggle.",
    },
    {
      title: "Password reset link expires too quickly",
      type: "bug", priority: "high", status: "in_progress", assignee: "tatenda", reporter: "admin", daysAgo: 4, dueInDays: 3,
      description: "Reset links expire after 10 minutes, but email delivery to some providers takes longer. Increase to 60 minutes and make links single-use.",
      comments: [["tatenda", "Single-use is done. Expiry change is waiting on a security review."]],
    },
    {
      title: "Add Shona translations for onboarding",
      type: "feature", priority: "medium", status: "open", assignee: null, reporter: "admin", daysAgo: 13,
      description: "Translate the five onboarding screens into Shona. Strings are in `locales/en/onboarding.json`. Nyasha from support offered to review.",
    },
    {
      title: "Profile photo upload fails on Safari",
      type: "bug", priority: "high", status: "in_review", assignee: "chipo", reporter: "tatenda", daysAgo: 6,
      description: "HEIC images from iPhones are rejected with \"unsupported format\". Convert client-side to JPEG before upload.",
      comments: [
        ["chipo", "PR converts HEIC with `createImageBitmap` when available and falls back to a server-side conversion."],
        ["farai", "Reviewed, one nit about the max dimension. Otherwise good to go."],
      ],
    },
    {
      title: "Move the analytics script behind the consent banner",
      type: "task", priority: "medium", status: "done", assignee: "farai", reporter: "admin", daysAgo: 19,
      description: "Analytics must not load until the visitor accepts cookies.",
    },
    {
      title: "Customer can't find their invoice history",
      type: "support", priority: "medium", status: "open", assignee: null, reporter: "tatenda", daysAgo: 1,
      description: "A customer emailed asking where old invoices went after the redesign. They're under **Billing → History**, which is two clicks deep. Consider a link from the dashboard.",
    },
    {
      title: "Accessibility score dropped to 82",
      type: "bug", priority: "medium", status: "in_progress", assignee: "chipo", reporter: "chipo", daysAgo: 5,
      description: "Lighthouse flags:\n\n- Buttons without accessible names in the header\n- Low contrast on the muted helper text\n- Missing `lang` on the Shona strings",
    },
    {
      title: "Replace moment.js with date-fns",
      type: "task", priority: "low", status: "done", assignee: "tatenda", reporter: "farai", daysAgo: 22,
      description: "Cuts ~60 KB from the bundle.",
    },
    {
      title: "Session expires while filling in long forms",
      type: "bug", priority: "urgent", status: "open", assignee: "farai", reporter: "admin", daysAgo: 2, dueInDays: 2,
      description: "Customers filling in the business verification form lose everything when the session expires at 30 minutes. Extend sessions on activity and save a draft locally.",
    },
    {
      title: "Add skeleton loaders to the account page",
      type: "task", priority: "low", status: "closed", assignee: "chipo", reporter: "chipo", daysAgo: 15,
      description: "Closing: superseded by the account page rebuild.",
    },
    {
      title: "Customer locked out after changing phone number",
      type: "support", priority: "high", status: "in_progress", assignee: "admin", reporter: "tatenda", daysAgo: 1,
      description: "OTP goes to the old number. Verify identity per the support runbook, then update the number from the admin console.",
    },
  ],
};

const PATHS: Record<Status, Status[]> = {
  open: [],
  in_progress: ["in_progress"],
  in_review: ["in_progress", "in_review"],
  done: ["in_progress", "in_review", "done"],
  closed: ["in_progress", "closed"],
};

const HOUR = 3_600_000;

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (see .env.example)");
  const { db } = await import("./index");
  const schema = await import("./schema");
  const { users, projects, tickets, comments, ticketHistory } = schema;
  const { sql } = await import("drizzle-orm");
  const bcrypt = (await import("bcryptjs")).default;

  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@nhimbe.local").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "change-me-please";
  const devPassword = process.env.SEED_DEV_PASSWORD ?? "nhimbe-dev-2026";
  PEOPLE.admin.email = adminEmail;

  if (process.argv.includes("--reset")) {
    await db.execute(sql`truncate ${ticketHistory}, ${comments}, ${tickets} restart identity cascade`);
    console.log("Cleared tickets, comments and history.");
  }

  const ids = {} as Record<Seat, string>;
  for (const [seat, p] of Object.entries(PEOPLE) as [Seat, (typeof PEOPLE)[Seat]][]) {
    const [row] = await db
      .insert(users)
      .values({
        name: p.name,
        email: p.email,
        role: p.role,
        passwordHash: await bcrypt.hash(seat === "admin" ? adminPassword : devPassword, 12),
      })
      .onConflictDoUpdate({ target: users.email, set: { name: p.name } })
      .returning({ id: users.id });
    ids[seat] = row.id;
  }

  const projectIds: Record<string, string> = {};
  for (const p of PROJECTS) {
    const [row] = await db
      .insert(projects)
      .values(p)
      .onConflictDoUpdate({ target: projects.key, set: { name: p.name } })
      .returning({ id: projects.id });
    projectIds[p.key] = row.id;
  }

  const [{ existing }] = await db.select({ existing: sql<number>`count(*)`.mapWith(Number) }).from(tickets);
  if (existing > 0) {
    console.log(`Users and projects ready. ${existing} tickets already exist; pass --reset to reseed them.`);
    process.exit(0);
  }

  const now = Date.now();
  let total = 0;
  for (const [projectKey, list] of Object.entries(TICKETS)) {
    for (const [index, t] of list.entries()) {
      const created = new Date(now - t.daysAgo * 24 * HOUR);
      const history: (typeof ticketHistory.$inferInsert)[] = [];
      const commentRows: (typeof comments.$inferInsert)[] = [];
      let clock = created.getTime();
      const tick = (hours: number) => new Date((clock += hours * HOUR));
      const span = Math.max(t.daysAgo * 24 - 2, 2);
      const step = span / (PATHS[t.status].length + (t.comments?.length ?? 0) + 2);

      if (t.assignee) {
        history.push({
          ticketId: "", userId: ids[t.assignee === t.reporter ? t.reporter : "admin"],
          field: "assignee_id", oldValue: null, newValue: ids[t.assignee], createdAt: tick(Math.min(step, 1)),
        });
      }
      let prev: Status = "open";
      let closedAt: Date | null = null;
      const comms = [...(t.comments ?? [])];
      for (const next of PATHS[t.status]) {
        if (comms.length > 1) {
          const [who, body] = comms.shift()!;
          commentRows.push({ ticketId: "", userId: ids[who], body, createdAt: tick(step) });
        }
        const at = tick(step);
        history.push({ ticketId: "", userId: ids[t.assignee ?? t.reporter], field: "status", oldValue: prev, newValue: next, createdAt: at });
        if (next === "done" || next === "closed") {
          closedAt = at;
          history.push({ ticketId: "", userId: ids[t.assignee ?? t.reporter], field: "closed_at", oldValue: null, newValue: at.toISOString(), createdAt: at });
        }
        prev = next;
      }
      for (const [who, body] of comms) {
        commentRows.push({ ticketId: "", userId: ids[who], body, createdAt: tick(step) });
      }
      const updatedAt = new Date(Math.min(clock, now - 5 * 60_000));
      const dueDate = t.dueInDays === undefined
        ? null
        : new Date(now + t.dueInDays * 24 * HOUR).toISOString().slice(0, 10);

      const [row] = await db
        .insert(tickets)
        .values({
          projectId: projectIds[projectKey],
          number: index + 1,
          title: t.title,
          description: t.description,
          type: t.type,
          priority: t.priority,
          status: t.status,
          reporterId: ids[t.reporter],
          assigneeId: t.assignee ? ids[t.assignee] : null,
          dueDate,
          createdAt: created,
          updatedAt,
          closedAt,
        })
        .returning({ id: tickets.id });

      if (history.length) await db.insert(ticketHistory).values(history.map((h) => ({ ...h, ticketId: row.id })));
      if (commentRows.length) await db.insert(comments).values(commentRows.map((c) => ({ ...c, ticketId: row.id })));
      total++;
    }
  }

  console.log(`Seeded ${Object.keys(PEOPLE).length} people, ${PROJECTS.length} projects, ${total} tickets.`);
  console.log(`  Admin:      ${adminEmail} / (SEED_ADMIN_PASSWORD)`);
  console.log(`  Developers: chipo@, farai@, tatenda@nhimbe.local / ${process.env.SEED_DEV_PASSWORD ? "(SEED_DEV_PASSWORD)" : devPassword}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
