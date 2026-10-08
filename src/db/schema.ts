import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { PRIORITIES, ROLES, STATUSES, TICKET_TYPES } from "../lib/constants";

export const roleEnum = pgEnum("role", ROLES);
export const ticketTypeEnum = pgEnum("ticket_type", TICKET_TYPES);
export const priorityEnum = pgEnum("priority", PRIORITIES);
export const statusEnum = pgEnum("status", STATUSES);

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("developer"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    key: varchar("key", { length: 10 }).notNull(),
    isArchived: boolean("is_archived").notNull().default(false),
  },
  (t) => [uniqueIndex("projects_key_idx").on(t.key)],
);

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "restrict" }),
    number: integer("number").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull().default(""),
    type: ticketTypeEnum("type").notNull().default("task"),
    priority: priorityEnum("priority").notNull().default("medium"),
    status: statusEnum("status").notNull().default("open"),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    assigneeId: uuid("assignee_id").references(() => users.id, {
      onDelete: "set null",
    }),
    dueDate: date("due_date", { mode: "string" }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("tickets_project_number_idx").on(t.projectId, t.number),
    index("tickets_status_idx").on(t.status),
    index("tickets_priority_idx").on(t.priority),
    index("tickets_type_idx").on(t.type),
    index("tickets_assignee_idx").on(t.assigneeId),
    index("tickets_reporter_idx").on(t.reporterId),
    index("tickets_updated_at_idx").on(t.updatedAt),
    index("tickets_due_date_idx").on(t.dueDate),
    // Trigram indexes back the ILIKE text search (requires pg_trgm).
    index("tickets_title_trgm_idx").using("gin", sql`${t.title} gin_trgm_ops`),
    index("tickets_description_trgm_idx").using(
      "gin",
      sql`${t.description} gin_trgm_ops`,
    ),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    createdAt: createdAt(),
    /** Set when the body is edited after posting. */
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (t) => [index("comments_ticket_idx").on(t.ticketId, t.createdAt)],
);

export const ticketHistory = pgTable(
  "ticket_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    field: varchar("field", { length: 40 }).notNull(),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    createdAt: createdAt(),
  },
  (t) => [index("ticket_history_ticket_idx").on(t.ticketId, t.createdAt)],
);

/** Failed-login counters for rate limiting, keyed by email + client IP. */
export const loginAttempts = pgTable("login_attempts", {
  key: varchar("key", { length: 400 }).primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type TicketHistory = typeof ticketHistory.$inferSelect;
