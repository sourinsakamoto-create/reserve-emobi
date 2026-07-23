// Resolves an absolute base URL for links inside emails, where a relative
// path won't work. Prefers an explicit override, then Vercel's own env vars
// (set automatically on every deployment, no configuration needed), and
// finally falls back to localhost for local development.
export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProductionUrl) return `https://${vercelProductionUrl}`;

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  return "http://localhost:3000";
}
