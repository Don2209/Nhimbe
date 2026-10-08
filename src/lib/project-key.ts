/**
 * Suggests a short ticket prefix from a project name:
 *   "Payments" → "PAY", "Customer Portal" → "CP", "Web app v2" → "WAV".
 * Always 2–6 characters, letters/digits, starting with a letter.
 */
export function suggestProjectKey(name: string) {
  const words = name
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toUpperCase());
  const lettersFirst = words.filter((w) => /^[A-Z]/.test(w));
  let key =
    lettersFirst.length >= 2
      ? lettersFirst.map((w) => w[0]).join("").slice(0, 4)
      : (lettersFirst[0] ?? "").slice(0, 3);
  if (key.length < 2) key = (lettersFirst[0] ?? "") + "PRJ";
  key = key.replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return /^[A-Z][A-Z0-9]{1,5}$/.test(key) ? key : "PRJ";
}
