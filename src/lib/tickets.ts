/** Formats the human-facing ticket key, e.g. "PAY-12". */
export function ticketKey(projectKey: string, number: number) {
  return `${projectKey}-${number}`;
}

export function parseTicketKey(key: string) {
  const match = /^([A-Za-z][A-Za-z0-9]{1,9})-(\d{1,9})$/.exec(key.trim());
  if (!match) return null;
  return { projectKey: match[1].toUpperCase(), number: Number(match[2]) };
}
