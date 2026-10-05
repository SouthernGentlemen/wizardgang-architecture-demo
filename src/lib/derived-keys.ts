import { ConfigurationError, deriveKey } from '#wg-edge';
import type { DerivedKeyLabel } from '#wg-edge';
import type { Env, SecretsStoreSecret } from '../types';

// Baseline config/secrets.json declares the labels (demo-session, identity-session, identity-audit) for the demo.
// wg-edge derives each one from the shared Secrets Store WG_SESSION_KEY, so the demo holds no signing secret of its own.

// The registry consumer of every label above. The Worker keeps its current name until DEMO-459 renames it, so the
// derivation names the consumer here rather than reading a WG_APP var the shell does not use yet.
const DEMO_APP = 'demo';

function hex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** True when the WG_SESSION_KEY binding (or a local string) is present; its value is read only when a key is derived. */
export function hasSessionKey(env: Pick<Env, 'WG_SESSION_KEY'>): boolean {
  const binding: SecretsStoreSecret | string | undefined = env.WG_SESSION_KEY;
  return typeof binding === 'string' ? binding.length > 0 : typeof binding?.get === 'function';
}

/** The 32-byte derived key for one label as 64 hex characters, or null when WG_SESSION_KEY is missing or empty. */
export async function derivedSecret(env: Pick<Env, 'WG_SESSION_KEY'>, label: DerivedKeyLabel): Promise<string | null> {
  if (!hasSessionKey(env)) return null;
  try {
    return hex(await deriveKey({ WG_APP: DEMO_APP, WG_SESSION_KEY: env.WG_SESSION_KEY }, label));
  } catch (error) {
    if (error instanceof ConfigurationError) return null;
    throw error;
  }
}
