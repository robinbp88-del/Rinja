/** Build authenticated preview URL for /api/proxy. */
export function buildProxyUrl(targetUrl: string, ticket: string): string {
  const params = new URLSearchParams({
    url: targetUrl,
    t: ticket,
  });
  return `/api/proxy?${params.toString()}`;
}
