import "server-only";

/** Postgres unique_violation, possibly wrapped by the driver. */
export function isUniqueViolation(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } } | undefined;
  return (e?.code ?? e?.cause?.code) === "23505";
}
