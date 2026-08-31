export interface D1RunResultMeta {
  last_row_id?: number;
}

export interface D1RunResult {
  meta: D1RunResultMeta;
}

export interface D1AllResult<T = Record<string, unknown>> {
  results: T[];
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<D1RunResult>;
  all<T = Record<string, unknown>>(): Promise<D1AllResult<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface R2ObjectBody {
  text(): Promise<string>;
}

export interface R2Bucket {
  put(key: string, value: string, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
}

export interface DurableObjectStorage {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
}

export interface DurableObjectState {
  storage: DurableObjectStorage;
}

export interface DurableObjectStub {
  fetch(request: Request): Promise<Response>;
}

export interface DurableObjectNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): DurableObjectStub;
}

export interface Env {
  DEMO_DB: D1Database;
  DEMO_R2?: R2Bucket;
  DEMO_COORDINATOR?: DurableObjectNamespace;
  GITHUB_REPO_URL: string;
  GITHUB_BRANCH: string;
  DEMO_ADMIN_USER?: string;
  DEMO_ADMIN_PASSWORD?: string;
  DEPLOYED_VERSION?: string;
  DEPLOYED_SHA?: string;
  BILLING_DEMO_MONTHLY_BUDGET_USD?: string;
}

export type DemoStatus = 'scaffolded' | 'working' | 'planned';

export interface DemoDefinition {
  id: string;
  route: string;
  title: string;
  group: string;
  sourcePath: string;
  summary: string;
  proves: string[];
  status: DemoStatus;
}
