import { z } from "zod";
import { PRIORITIES, ROLES, STATUSES, TICKET_TYPES } from "@/lib/constants";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address").max(254));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(200),
});

const blankToNull = (v: unknown) =>
  v === "" || v === undefined || v === "none" ? null : v;

export const idSchema = z.uuid("Invalid id");

export const ticketKeySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z][A-Z0-9]{1,9}-\d{1,9}$/, "Invalid ticket key");

export const titleSchema = z
  .string()
  .trim()
  .min(1, "Give the ticket a title")
  .max(200, "Keep the title under 200 characters");

export const markdownSchema = z
  .string()
  .max(20_000, "That's too long (20,000 characters max)");

export const dueDateSchema = z.preprocess(
  blankToNull,
  z.iso.date("Use a valid date").nullable(),
);

export const assigneeSchema = z.preprocess(blankToNull, idSchema.nullable());

export const ticketFieldsSchema = z.object({
  title: titleSchema,
  description: markdownSchema,
  type: z.enum(TICKET_TYPES),
  priority: z.enum(PRIORITIES),
  status: z.enum(STATUSES),
  assigneeId: assigneeSchema,
  dueDate: dueDateSchema,
});

export const ticketCreateSchema = ticketFieldsSchema.extend({
  projectId: idSchema,
  description: markdownSchema.default(""),
});
export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;

/**
 * Any subset of editable fields; the project (and so the key) is fixed.
 * No defaults here: a missing key must mean "leave unchanged".
 */
export const ticketPatchSchema = ticketFieldsSchema.partial();
export type TicketPatch = z.infer<typeof ticketPatchSchema>;

export const commentSchema = z.object({
  ticketId: idSchema,
  body: markdownSchema.trim().min(1, "Write something first"),
});

// ---- URL filters for the ticket list ----

/** Comma-separated URL values; unknown entries are dropped, not fatal. */
const csvOf = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(
    (v) => [
      ...new Set(
        (Array.isArray(v) ? v.join(",") : typeof v === "string" ? v : "")
          .split(",")
          .map((s) => s.trim())
          .filter((s) => (values as readonly string[]).includes(s)),
      ),
    ],
    z.array(z.enum(values)),
  );

const csvMatching = (pattern: RegExp, normalise = (s: string) => s) =>
  z.preprocess(
    (v) => [
      ...new Set(
        (Array.isArray(v) ? v.join(",") : typeof v === "string" ? v : "")
          .split(",")
          .map((s) => normalise(s.trim()))
          .filter((s) => pattern.test(s)),
      ),
    ],
    z.array(z.string()),
  );

export const SORT_FIELDS = ["updated", "created", "priority", "status", "due", "number", "title"] as const;
export type SortField = (typeof SORT_FIELDS)[number];

const firstString = (v: unknown) => (Array.isArray(v) ? v[0] : v);

export const ticketFiltersSchema = z.object({
  status: csvOf(STATUSES),
  priority: csvOf(PRIORITIES),
  type: csvOf(TICKET_TYPES),
  // Project keys and assignee ids ("me" and "none" are special values).
  project: csvMatching(/^[A-Z][A-Z0-9]{1,9}$/, (s) => s.toUpperCase()),
  assignee: csvMatching(/^(me|none|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i, (s) => s.toLowerCase()),
  q: z.preprocess(firstString, z.string().trim().max(200).catch("")).default(""),
  sort: z.preprocess(firstString, z.enum(SORT_FIELDS).catch("updated")).default("updated"),
  dir: z.preprocess(firstString, z.enum(["asc", "desc"]).catch("desc")).default("desc"),
  page: z.preprocess(firstString, z.coerce.number().int().min(1).max(10_000).catch(1)).default(1),
});
export type TicketFilters = z.infer<typeof ticketFiltersSchema>;

// ---- Admin ----

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(200, "Keep it under 200 characters");

export const userCreateSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(120),
  email: emailSchema,
  role: z.enum(ROLES),
  password: passwordSchema,
});

export const userUpdateSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1, "Enter a name").max(120),
  email: emailSchema,
  role: z.enum(ROLES),
});

export const passwordResetSchema = z.object({ id: idSchema, password: passwordSchema });

export const projectCreateSchema = z.object({
  name: z.string().trim().min(1, "Give the project a name").max(120),
  // Optional: when blank, a prefix is derived from the name.
  key: z.preprocess(
    (v) => (typeof v === "string" ? v.replace(/[^A-Za-z0-9]/g, "").toUpperCase() : v),
    z
      .string()
      .regex(/^([A-Z][A-Z0-9]{1,9})?$/, "Use 2–10 letters or numbers, starting with a letter")
      .optional(),
  ),
});

export const projectUpdateSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1, "Enter a name").max(120),
});

// ---- Profile & editing ----

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(120),
  email: emailSchema,
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(200),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "The passwords don't match",
  });

export const commentEditSchema = z.object({
  id: idSchema,
  body: markdownSchema.trim().min(1, "Write something first"),
});
