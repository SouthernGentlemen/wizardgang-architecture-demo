export interface D1RunResultMeta {
  last_row_id?: number;
  changes?: number;
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
  arrayBuffer?(): Promise<ArrayBuffer>;
  body?: ReadableStream<Uint8Array>;
  size?: number;
  etag?: string;
  uploaded?: Date;
  httpMetadata?: { contentType?: string };
}

export interface R2Bucket {
  put(key: string, value: string | ArrayBuffer | ReadableStream<Uint8Array>, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
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
  DEMO_API_TOKEN?: string;
  WEBHOOK_DEMO_SECRET?: string;
  GITHUB_WEBHOOK_SECRET?: string;
  GITHUB_READ_TOKEN?: string;
  GITHUB_REPORTING_WRITE_TOKEN?: string;
  GITHUB_REPORTING_BINDINGS?: string;
  GITHUB_REPORTING_MAX_PAGES?: string;
  GITHUB_DEMO_TOKEN?: string;
  DEMO_SESSION_SECRET?: string;
  IDENTITY_SESSION_SECRET?: string;
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_CLIENT_SECRET?: string;
  MICROSOFT_TENANT_ID?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  SAML_IDP_CERT?: string;
  SAML_IDP_ISSUER?: string;
  SAML_SSO_URL?: string;
  DEPLOYED_VERSION?: string;
  DEPLOYED_SHA?: string;
  DEPLOYMENT_ENVIRONMENT?: string;
  DEPLOYMENT_CI_STATUS?: string;
  BILLING_DEMO_MONTHLY_BUDGET_USD?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_WORKER_NAME?: string;
  CLOUDFLARE_R2_BUCKET?: string;
  CLOUDFLARE_D1_DATABASE_ID?: string;
  CLOUDFLARE_DO_NAMESPACE?: string;
}

export type DemoStatus = 'working' | 'planned';

export interface DemoAction {
  id?: string;
  aliases?: string[];
  title?: string;
  description?: string;
  label: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
}

export interface DemoDefinition {
  id: string;
  route: string;
  title: string;
  group: string;
  sourcePath: string;
  summary: string;
  notice?: string;
  proves: string[];
  status: DemoStatus;
  sections?: Array<{
    id: string;
    title: string;
    description: string;
    points?: string[];
  }>;
  interfaces?: Array<{
    method: string;
    path: string;
    description: string;
  }>;
  supportingSources?: Array<{
    label: string;
    path: string;
  }>;
  action?: DemoAction;
  actions?: DemoAction[];
  repositoryLinks?: Array<{
    label: string;
    path: string;
  }>;
}
