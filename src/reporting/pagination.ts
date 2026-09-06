import type {
  ReportingPagination,
  ReportingPaginationCompleteness,
  ReportingPaginationPartialReason,
  ReportingProvider,
  ReportingScalar,
} from './contracts';

export const REPORTING_PAGE_SIZE_MIN = 1;
export const REPORTING_PAGE_SIZE_MAX = 100;
export const REPORTING_CURSOR_VERSION = 1;

const REPORTING_CURSOR_PREFIX = `rpc${REPORTING_CURSOR_VERSION}`;
const REPORTING_CURSOR_IV_BYTES = 12;
const REPORTING_CURSOR_TAG_BYTES = 16;
const REPORTING_CURSOR_MAX_LENGTH = 8192;
const REPORTING_CURSOR_MIN_SECRET_BYTES = 16;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8', { fatal: true });

export type ReportingFilterValue = ReportingScalar | readonly ReportingScalar[];
export type ReportingFilters = Readonly<Record<string, ReportingFilterValue>>;

export interface ReportingOrdering {
  field: string;
  direction: 'asc' | 'desc';
}

export type ReportingCursorValue =
  | ReportingScalar
  | readonly ReportingCursorValue[]
  | { readonly [key: string]: ReportingCursorValue };

export type ReportingCursorPosition = Readonly<Record<string, ReportingCursorValue>>;

export interface ReportingProviderContinuation {
  provider: ReportingProvider;
  data: ReportingCursorValue;
}

export interface ReportingCursorContext {
  schemaVersion: number;
  collection: string;
  source: string;
  filters: ReportingFilters;
  ordering: readonly ReportingOrdering[];
}

export interface ReportingCursorContinuation {
  position: ReportingCursorPosition;
  provider?: ReportingProviderContinuation;
}

export type ReportingCursorErrorCode =
  | 'reporting_cursor_malformed'
  | 'reporting_cursor_mismatch'
  | 'reporting_cursor_stale'
  | 'reporting_cursor_unknown';

export class ReportingCursorError extends Error {
  constructor(
    readonly code: ReportingCursorErrorCode,
    readonly detail?: string,
  ) {
    super(code);
    this.name = 'ReportingCursorError';
  }
}

interface ReportingCursorPayload {
  cursorVersion: 1;
  schemaVersion: number;
  collection: string;
  source: string;
  filters: Readonly<Record<string, ReportingFilterValue>>;
  ordering: readonly ReportingOrdering[];
  position: ReportingCursorPosition;
  provider?: ReportingProviderContinuation;
}

interface PaginationInput {
  limit: number;
  returned: number;
  total: number;
  nextCursor: string | null;
  completeness: ReportingPaginationCompleteness;
  partialReason: ReportingPaginationPartialReason | null;
}

function plainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeScalar(value: ReportingScalar, label: string): ReportingScalar {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`${label} must contain only finite numbers.`);
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'boolean' || value === null) return value;
  throw new TypeError(`${label} contains an unsupported value.`);
}

function stableValue(value: ReportingCursorValue, label: string): ReportingCursorValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`${label} must contain only finite numbers.`);
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) return value.map((entry, index) => stableValue(entry, `${label}[${index}]`));
  if (!plainObject(value)) throw new TypeError(`${label} must be JSON-safe.`);
  const result: Record<string, ReportingCursorValue> = {};
  for (const key of Object.keys(value).sort()) {
    if (!key) throw new TypeError(`${label} contains an empty key.`);
    result[key] = stableValue(value[key] as ReportingCursorValue, `${label}.${key}`);
  }
  return result;
}

function stableStringify(value: ReportingCursorValue): string {
  return JSON.stringify(stableValue(value, 'cursor value'));
}

export function normalizeReportingFilters(filters: ReportingFilters): Readonly<Record<string, ReportingFilterValue>> {
  if (!plainObject(filters)) throw new TypeError('Reporting filters must be an object.');
  const result: Record<string, ReportingFilterValue> = {};
  const normalizedNames = new Set<string>();
  for (const [rawName, rawValue] of Object.entries(filters).sort(([left], [right]) => left.localeCompare(right))) {
    const name = rawName.trim();
    if (!name) throw new TypeError('Reporting filter names must be non-empty.');
    if (normalizedNames.has(name)) throw new TypeError(`Duplicate normalized reporting filter: ${name}`);
    normalizedNames.add(name);
    if (Array.isArray(rawValue)) {
      const values = rawValue.map((entry) => normalizeScalar(entry, `Reporting filter ${name}`));
      const unique = new Map(values.map((entry) => [JSON.stringify(entry), entry]));
      result[name] = [...unique.values()].sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
    } else {
      result[name] = normalizeScalar(rawValue as ReportingScalar, `Reporting filter ${name}`);
    }
  }
  return result;
}

export function normalizeReportingOrdering(ordering: readonly ReportingOrdering[]): readonly ReportingOrdering[] {
  if (!Array.isArray(ordering)) throw new TypeError('Reporting ordering must be an array.');
  const fields = new Set<string>();
  return ordering.map((entry, index) => {
    if (!plainObject(entry) || !hasOnlyKeys(entry, new Set(['field', 'direction']))) {
      throw new TypeError(`Reporting ordering entry ${index} is invalid.`);
    }
    const field = typeof entry.field === 'string' ? entry.field.trim() : '';
    if (!field) throw new TypeError(`Reporting ordering entry ${index} requires a field.`);
    if (fields.has(field)) throw new TypeError(`Duplicate reporting ordering field: ${field}`);
    fields.add(field);
    if (entry.direction !== 'asc' && entry.direction !== 'desc') {
      throw new TypeError(`Reporting ordering entry ${index} requires asc or desc.`);
    }
    return { field, direction: entry.direction };
  });
}

function normalizeContext(context: ReportingCursorContext): ReportingCursorContext {
  if (!Number.isSafeInteger(context.schemaVersion) || context.schemaVersion < 1) {
    throw new TypeError('Reporting cursor schemaVersion must be a positive integer.');
  }
  const collection = context.collection.trim();
  const source = context.source.trim();
  if (!collection) throw new TypeError('Reporting cursor collection is required.');
  if (!source) throw new TypeError('Reporting cursor source is required.');
  return {
    schemaVersion: context.schemaVersion,
    collection,
    source,
    filters: normalizeReportingFilters(context.filters),
    ordering: normalizeReportingOrdering(context.ordering),
  };
}

function normalizeContinuation(continuation: ReportingCursorContinuation): ReportingCursorContinuation {
  if (!plainObject(continuation.position)) throw new TypeError('Reporting cursor position must be an object.');
  const position = stableValue(continuation.position, 'Reporting cursor position') as ReportingCursorPosition;
  if (!continuation.provider) return { position };
  if (!plainObject(continuation.provider)
    || !hasOnlyKeys(continuation.provider, new Set(['provider', 'data']))
    || (continuation.provider.provider !== 'github' && continuation.provider.provider !== 'cloudflare')) {
    throw new TypeError('Reporting provider continuation is invalid.');
  }
  return {
    position,
    provider: {
      provider: continuation.provider.provider,
      data: stableValue(continuation.provider.data, 'Reporting provider continuation'),
    },
  };
}

function payloadFrom(context: ReportingCursorContext, continuation: ReportingCursorContinuation): ReportingCursorPayload {
  const normalized = normalizeContext(context);
  const normalizedContinuation = normalizeContinuation(continuation);
  return {
    cursorVersion: REPORTING_CURSOR_VERSION,
    schemaVersion: normalized.schemaVersion,
    collection: normalized.collection,
    source: normalized.source,
    filters: normalized.filters,
    ordering: normalized.ordering,
    position: normalizedContinuation.position,
    ...(normalizedContinuation.provider ? { provider: normalizedContinuation.provider } : {}),
  };
}

function secretBytes(secret: string | Uint8Array): Uint8Array {
  const bytes = typeof secret === 'string' ? textEncoder.encode(secret) : new Uint8Array(secret);
  if (bytes.byteLength < REPORTING_CURSOR_MIN_SECRET_BYTES) {
    throw new TypeError(`Reporting cursor secret must be at least ${REPORTING_CURSOR_MIN_SECRET_BYTES} bytes.`);
  }
  return bytes;
}

function ownedBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function cursorKey(secret: string | Uint8Array): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest('SHA-256', ownedBuffer(secretBytes(secret)));
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value: string): Uint8Array {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) throw new ReportingCursorError('reporting_cursor_malformed');
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  try {
    const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + padding);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    throw new ReportingCursorError('reporting_cursor_malformed');
  }
}

function opaqueEnvelope(iv: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  const envelope = new Uint8Array(iv.length + ciphertext.length);
  envelope.set(iv, 0);
  envelope.set(ciphertext, iv.length);
  return envelope;
}

function parsePayload(value: unknown): ReportingCursorPayload {
  if (!plainObject(value)
    || !hasOnlyKeys(value, new Set(['cursorVersion', 'schemaVersion', 'collection', 'source', 'filters', 'ordering', 'position', 'provider']))) {
    throw new ReportingCursorError('reporting_cursor_malformed');
  }
  if (value.cursorVersion !== REPORTING_CURSOR_VERSION) throw new ReportingCursorError('reporting_cursor_unknown');
  if (!Number.isSafeInteger(value.schemaVersion) || Number(value.schemaVersion) < 1) {
    throw new ReportingCursorError('reporting_cursor_malformed');
  }
  if (!nonEmpty(value.collection) || !nonEmpty(value.source) || !plainObject(value.filters) || !Array.isArray(value.ordering) || !plainObject(value.position)) {
    throw new ReportingCursorError('reporting_cursor_malformed');
  }
  try {
    const context = normalizeContext({
      schemaVersion: Number(value.schemaVersion),
      collection: value.collection,
      source: value.source,
      filters: value.filters as ReportingFilters,
      ordering: value.ordering as ReportingOrdering[],
    });
    const continuation = normalizeContinuation({
      position: value.position as ReportingCursorPosition,
      ...(value.provider !== undefined ? { provider: value.provider as ReportingProviderContinuation } : {}),
    });
    return payloadFrom(context, continuation);
  } catch (error) {
    if (error instanceof ReportingCursorError) throw error;
    throw new ReportingCursorError('reporting_cursor_malformed');
  }
}

function sameFilters(left: ReportingFilters, right: ReportingFilters): boolean {
  return stableStringify(left as unknown as ReportingCursorValue) === stableStringify(right as unknown as ReportingCursorValue);
}

function sameOrdering(left: readonly ReportingOrdering[], right: readonly ReportingOrdering[]): boolean {
  return stableStringify(left as unknown as ReportingCursorValue) === stableStringify(right as unknown as ReportingCursorValue);
}

export async function encodeReportingCursor(
  context: ReportingCursorContext,
  continuation: ReportingCursorContinuation,
  secret: string | Uint8Array,
): Promise<string> {
  const payload = payloadFrom(context, continuation);
  const plaintext = textEncoder.encode(JSON.stringify(payload));
  const iv = crypto.getRandomValues(new Uint8Array(REPORTING_CURSOR_IV_BYTES));
  const key = await cursorKey(secret);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({
    name: 'AES-GCM',
    iv: ownedBuffer(iv),
    additionalData: ownedBuffer(textEncoder.encode(REPORTING_CURSOR_PREFIX)),
  }, key, ownedBuffer(plaintext)));
  return `${REPORTING_CURSOR_PREFIX}.${base64UrlEncode(opaqueEnvelope(iv, ciphertext))}`;
}

export async function decodeReportingCursor(
  cursor: string,
  expectedContext: ReportingCursorContext,
  secret: string | Uint8Array,
): Promise<ReportingCursorContinuation> {
  if (typeof cursor !== 'string' || !cursor || cursor.length > REPORTING_CURSOR_MAX_LENGTH) {
    throw new ReportingCursorError('reporting_cursor_malformed');
  }
  const parts = cursor.split('.');
  if (parts.length !== 2) throw new ReportingCursorError('reporting_cursor_malformed');
  if (parts[0] !== REPORTING_CURSOR_PREFIX) {
    if (/^rpc\d+$/.test(parts[0])) throw new ReportingCursorError('reporting_cursor_unknown');
    throw new ReportingCursorError('reporting_cursor_malformed');
  }
  const envelope = base64UrlDecode(parts[1]);
  if (envelope.length <= REPORTING_CURSOR_IV_BYTES + REPORTING_CURSOR_TAG_BYTES) {
    throw new ReportingCursorError('reporting_cursor_malformed');
  }
  const iv = envelope.slice(0, REPORTING_CURSOR_IV_BYTES);
  const ciphertext = envelope.slice(REPORTING_CURSOR_IV_BYTES);
  const key = await cursorKey(secret);
  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt({
      name: 'AES-GCM',
      iv: ownedBuffer(iv),
      additionalData: ownedBuffer(textEncoder.encode(REPORTING_CURSOR_PREFIX)),
    }, key, ownedBuffer(ciphertext));
  } catch {
    throw new ReportingCursorError('reporting_cursor_malformed');
  }
  let decoded: unknown;
  try {
    decoded = JSON.parse(textDecoder.decode(plaintext));
  } catch {
    throw new ReportingCursorError('reporting_cursor_malformed');
  }
  const payload = parsePayload(decoded);
  const expected = normalizeContext(expectedContext);
  if (payload.schemaVersion !== expected.schemaVersion) {
    throw new ReportingCursorError('reporting_cursor_stale', 'schemaVersion');
  }
  if (payload.collection !== expected.collection) throw new ReportingCursorError('reporting_cursor_mismatch', 'collection');
  if (payload.source !== expected.source) throw new ReportingCursorError('reporting_cursor_mismatch', 'source');
  if (!sameFilters(payload.filters, expected.filters)) throw new ReportingCursorError('reporting_cursor_mismatch', 'filters');
  if (!sameOrdering(payload.ordering, expected.ordering)) throw new ReportingCursorError('reporting_cursor_mismatch', 'ordering');
  return normalizeContinuation({
    position: payload.position,
    ...(payload.provider ? { provider: payload.provider } : {}),
  });
}

export function validateReportingPageSize(limit: number): number {
  if (!Number.isSafeInteger(limit) || limit < REPORTING_PAGE_SIZE_MIN || limit > REPORTING_PAGE_SIZE_MAX) {
    throw new RangeError(`Reporting page size must be an integer from ${REPORTING_PAGE_SIZE_MIN} through ${REPORTING_PAGE_SIZE_MAX}.`);
  }
  return limit;
}

function nonNegativeCount(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${label} must be a non-negative integer.`);
  return value;
}

export function createReportingPagination(input: PaginationInput): ReportingPagination {
  const limit = validateReportingPageSize(input.limit);
  const returned = nonNegativeCount(input.returned, 'Reporting returned count');
  const total = nonNegativeCount(input.total, 'Reporting total count');
  if (returned > total) throw new RangeError('Reporting returned count cannot exceed total observed records.');
  if (input.nextCursor !== null && (typeof input.nextCursor !== 'string' || input.nextCursor.trim().length === 0)) {
    throw new TypeError('Reporting nextCursor must be a non-empty opaque cursor or null.');
  }
  if (input.completeness === 'complete') {
    if (input.partialReason !== null) throw new TypeError('Complete reporting pagination cannot have a partial reason.');
    if (input.nextCursor !== null) throw new TypeError('Complete reporting pagination cannot have a continuation cursor.');
  } else if (input.completeness === 'partial') {
    if (input.partialReason === null) throw new TypeError('Partial reporting pagination requires a reason.');
  } else {
    throw new TypeError('Reporting completeness must be complete or partial.');
  }
  return {
    limit,
    returned,
    total,
    nextCursor: input.nextCursor,
    completeness: input.completeness,
    partialReason: input.partialReason,
  };
}
