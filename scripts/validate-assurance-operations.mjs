import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const live = process.argv.includes('--live');
const nowValue = process.env.ASSURANCE_VALIDATION_NOW ?? new Date().toISOString();
const validationNow = Date.parse(nowValue);
const errors = [];
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = (relative) => JSON.parse(read(relative));

if (Number.isNaN(validationNow)) errors.push(`ASSURANCE_VALIDATION_NOW is not a valid date-time: ${nowValue}`);

const config = readJson('assurance/operations/monitoring.json');
const registry = readJson('assurance/registry.json');
const owners = config.accountableOwners ?? {};
const requiredOwnerKeys = new Set(['registry', 'lifecycle', 'securityReporting']);
for (const dataset of registry.datasets ?? []) requiredOwnerKeys.add(dataset.kind);
for (const key of requiredOwnerKeys) {
  if (typeof owners[key] !== 'string' || owners[key].trim().length < 3) errors.push(`missing accountable owner for ${key}`);
}

const reporting = config.securityReporting ?? {};
const baseUrl = String(config.baseUrl ?? '').replace(/\/$/, '');
const policyUrl = `${baseUrl}${reporting.policyRoute ?? ''}`;
const securityTxtUrl = `${baseUrl}${reporting.securityTxtRoute ?? ''}`;
const securityDoc = read('SECURITY.md');
const router = read('src/router.ts');

for (const [label, value] of [
  ['policy URL', policyUrl],
  ['security.txt URL', securityTxtUrl],
  ['private reporting URL', reporting.privateReportingUrl],
]) {
  if (!value || !securityDoc.includes(value)) errors.push(`SECURITY.md is missing the configured ${label}: ${value}`);
}
for (const route of [reporting.policyRoute, reporting.securityTxtRoute]) {
  if (!route || !router.includes(`'${route}'`)) errors.push(`src/router.ts is missing configured reporting route ${route}`);
}

const expirySource = reporting.expirySource;
if (!expirySource || !fs.existsSync(path.join(root, expirySource))) {
  errors.push(`security.txt expiry source is missing: ${expirySource}`);
} else {
  const match = read(expirySource).match(/SECURITY_TXT_EXPIRES\s*=\s*['\"]([^'\"]+)['\"]/);
  if (!match) {
    errors.push(`${expirySource}: SECURITY_TXT_EXPIRES constant is missing`);
  } else {
    const expiresAt = Date.parse(match[1]);
    if (Number.isNaN(expiresAt)) errors.push(`${expirySource}: SECURITY_TXT_EXPIRES is not a valid date-time`);
    else if (!Number.isNaN(validationNow) && expiresAt <= validationNow) errors.push(`security.txt expired at ${match[1]}`);
  }
}

async function fetchChecked(url, init = {}) {
  try {
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000), ...init });
    if (!response.ok) {
      errors.push(`reporting link unavailable: ${url} returned ${response.status}`);
      return null;
    }
    return response;
  } catch (error) {
    errors.push(`reporting link unavailable: ${url}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

if (live && errors.length === 0) {
  const policyResponse = await fetchChecked(policyUrl);
  const securityTxtResponse = await fetchChecked(securityTxtUrl);
  if (policyResponse) await policyResponse.arrayBuffer();

  if (securityTxtResponse) {
    const text = await securityTxtResponse.text();
    const fields = new Map();
    for (const line of text.split(/\r?\n/)) {
      const separator = line.indexOf(':');
      if (separator <= 0) continue;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      if (!fields.has(key)) fields.set(key, []);
      fields.get(key).push(value);
    }
    if (!fields.get('Policy')?.includes(policyUrl)) errors.push(`live security.txt Policy does not match ${policyUrl}`);
    if (!fields.get('Canonical')?.includes(securityTxtUrl)) errors.push(`live security.txt Canonical does not match ${securityTxtUrl}`);
    if (!fields.get('Contact')?.includes(reporting.privateReportingUrl)) errors.push('live security.txt Contact does not match the configured private reporting URL');
    const expiresValue = fields.get('Expires')?.[0];
    const expiresAt = Date.parse(expiresValue ?? '');
    if (!expiresValue || Number.isNaN(expiresAt)) errors.push('live security.txt Expires is missing or invalid');
    else if (!Number.isNaN(validationNow) && expiresAt <= validationNow) errors.push(`live security.txt expired at ${expiresValue}`);

    for (const key of ['Contact', 'Policy', 'Canonical']) {
      for (const url of fields.get(key) ?? []) await fetchChecked(url, { headers: { 'user-agent': 'wizardgang-assurance-monitor' } });
    }
  }

  const response = await fetchChecked(reporting.privateReportingApi, {
    headers: {
      accept: 'application/vnd.github+json',
      'user-agent': 'wizardgang-assurance-monitor',
      'x-github-api-version': '2026-03-10',
    },
  });
  if (response) {
    const body = await response.json().catch(() => null);
    if (body?.enabled !== true) errors.push('GitHub private vulnerability reporting is not enabled');
  }
}

if (errors.length) {
  console.error(`Assurance operational validation failed${live ? ' (live)' : ''}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Assurance operational validation passed${live ? ' with live reporting checks' : ''}: ${requiredOwnerKeys.size} accountable ownership assignments; security.txt is current.`);
