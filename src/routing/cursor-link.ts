export function cursorLink(request: Request, cursor: string | null | undefined): string | null {
  if (!cursor) return null;
  const url = new URL(request.url);
  url.searchParams.set('cursor', cursor);
  return `${url.pathname}${url.search}${url.hash}`;
}
