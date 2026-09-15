import { AVAILABILITY_RETENTION_DAYS, collectHealth } from '../api/operations';
import { escapeHtml } from '../lib/html';
import { repoUrl } from '../lib/github';
import { routeUrl } from '../routing/application-routes';
import type { Env } from '../types';
import { localizationForEnv } from '../i18n/runtime';
import { pageResponse } from './page';

interface AvailabilityProof {
  label: string;
  detail: string;
}

const homeStyles = `<style>
.home-actions>.button-primary{border-color:var(--acid);background:var(--acid);color:var(--button-text)}
.home-actions>.button-primary:hover{border-color:var(--paper);background:var(--acid);color:var(--button-text)}
</style>`;

async function currentState(env: Env): Promise<string> {
  try {
    const snapshot = await collectHealth(env, false);
    return snapshot.status;
  } catch {
    return 'unknown';
  }
}

async function measuredAvailability(env: Env): Promise<AvailabilityProof> {
  const cutoff = new Date(Date.now() - AVAILABILITY_RETENTION_DAYS * 86_400_000).toISOString();
  const scheduledMarker = '%"observationSource":"scheduled"%';
  try {
    const result = await env.DEMO_DB.prepare(`SELECT COUNT(*) AS verified,
      SUM(CASE WHEN status='operational' THEN 1 ELSE 0 END) AS operational,
      SUM(CASE WHEN COALESCE(detail_json,'') LIKE '%"intentionalOffline":true%' THEN 1 ELSE 0 END) AS intentional
      FROM service_health_checks
      WHERE service_key='public-demo' AND checked_at>=? AND COALESCE(detail_json,'') LIKE ?`)
      .bind(cutoff, scheduledMarker).all<{ verified: number; operational: number; intentional: number }>();
    const row = result.results[0];
    const verified = Number(row?.verified ?? 0);
    const intentional = Number(row?.intentional ?? 0);
    const measured = Math.max(0, verified - intentional);
    const operational = Number(row?.operational ?? 0);
    if (!measured) {
      return { label: 'Awaiting data', detail: `Scheduled observations · ${AVAILABILITY_RETENTION_DAYS}-day retention` };
    }
    return {
      label: `${(operational / measured * 100).toFixed(3)}%`,
      detail: `${measured} measured intervals · planned offline excluded`,
    };
  } catch {
    return { label: 'Unavailable', detail: `Scheduled observations · ${AVAILABILITY_RETENTION_DAYS}-day retention` };
  }
}

function versionProof(env: Env): { label: string; detail: string; href: string } {
  const version = env.DEPLOYED_VERSION || 'development';
  const commit = env.DEPLOYED_SHA?.trim() || '';
  return {
    label: version,
    detail: commit ? `Commit ${commit.slice(0, 7)}` : 'Commit not supplied',
    href: commit ? `${repoUrl(env)}/commit/${encodeURIComponent(commit)}` : repoUrl(env),
  };
}

export async function renderHome(env: Env): Promise<Response> {
  const localization = localizationForEnv(env);
  const [state, availability] = await Promise.all([
    currentState(env),
    measuredAvailability(env),
  ]);
  const version = versionProof(env);
  const demos = localization.href(routeUrl('demos.index'));
  const assurance = localization.href(routeUrl('assurance.index'));
  const security = localization.href(routeUrl('security.index'));
  const home = routeUrl('interfaces.frontend.index');

  const body = `
<section class="page-header home-header">
  <h1>Architecture <span>you can inspect.</span></h1>
  <div class="home-intro">
    <p class="lede home-lede">A live Cloudflare architecture laboratory you can run, inspect, and verify against public source.</p>
  </div>
  <div class="link-row home-actions" aria-label="Primary actions">
    <a class="button-primary" href="${escapeHtml(demos)}">Explore demos</a>
    <a href="${escapeHtml(assurance)}">View assurance</a>
  </div>
</section>
<section class="architecture-strip home-proof-strip" aria-label="Live proof">
  <article><strong>${escapeHtml(state)}</strong><span>Current service state</span></article>
  <article><strong>${escapeHtml(availability.label)}</strong><span>${escapeHtml(availability.detail)}</span></article>
  <article><strong><a href="${escapeHtml(version.href)}">${escapeHtml(version.label)}</a></strong><span>${escapeHtml(version.detail)}</span></article>
</section>
<p class="subtle">Sensitive security reports and published advisories stay on the <a href="${escapeHtml(security)}">Security boundary</a>.</p>`;

  return pageResponse(env, 'Architecture', body, {
    routeId: 'interfaces.frontend.index',
    canonicalPath: home,
    description: 'A live Cloudflare architecture laboratory with executable demonstrations and inspectable assurance evidence.',
    headExtra: homeStyles,
  });
}
