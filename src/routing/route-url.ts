export type RouteQuery = Readonly<Record<string, string | undefined>>;

export function withRouteQuery(
  url: string,
  query: RouteQuery = {},
): string {
  const entries = Object.entries(query).filter((entry): entry is [string, string] => entry[1] !== undefined);
  if (entries.length === 0) return url;

  const hashIndex = url.indexOf('#');
  const hash = hashIndex === -1 ? '' : url.slice(hashIndex);
  const withoutHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const queryIndex = withoutHash.indexOf('?');
  const path = queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex);
  const search = new URLSearchParams(queryIndex === -1 ? '' : withoutHash.slice(queryIndex + 1));

  for (const [name, value] of entries) search.set(name, value);
  const serialized = search.toString();
  return `${path}${serialized ? `?${serialized}` : ''}${hash}`;
}
