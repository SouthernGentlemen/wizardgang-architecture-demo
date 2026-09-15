import type { Env } from '../types';
import { routeUrl } from '../routing/application-routes';
import { pageContent, type PageContent } from '../ui/page';
import { openApiConsole } from './openapi-console';

const restContainmentStyles = `<style>
.rest-operation-browser{display:grid;grid-template-columns:minmax(14rem,.85fr) minmax(0,2.15fr);gap:1rem;align-items:start;min-width:0}
.rest-operation-picker,.rest-operation-detail,.rest-operation-panel,.rest-task-block,.rest-contract-schemas,.rest-contract-schema{min-width:0;max-width:100%}
.rest-operation-picker,.rest-operation-panel{border:1px solid var(--line);background:var(--panel)}
.rest-operation-picker{position:sticky;top:1rem;padding:1rem}
.rest-operation-picker>h2{margin-bottom:.55rem;font-size:1.45rem}
.rest-operation-picker>p{color:var(--muted)}
.rest-operation-choices{display:grid;gap:.45rem;margin:1rem 0}
.rest-operation-choice{display:grid;grid-template-columns:auto minmax(0,1fr);gap:.65rem;align-items:start;width:100%;min-width:0;padding:.7rem;border:1px solid var(--line);background:transparent;color:var(--paper);text-align:left}
.rest-operation-choice[aria-pressed="true"]{border-color:var(--acid);background:var(--panel-2)}
.rest-operation-choice-copy{display:grid;min-width:0;gap:.15rem}
.rest-operation-choice-copy code,.rest-operation-title code{overflow-wrap:anywhere}.rest-operation-choice-copy code{color:var(--paper)}
.rest-operation-choice-copy strong{font-size:.84rem}
.rest-server{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.65rem;align-items:center;margin:.8rem 0;padding:.65rem 0;border-block:1px solid var(--line)}
.rest-server div{display:grid;min-width:0;gap:.2rem}.rest-server span{color:var(--muted);font-size:.72rem;text-transform:uppercase}.rest-server code{overflow-wrap:anywhere}
.rest-deeper-evidence{margin-top:1rem;border-top:1px solid var(--line);padding-top:.8rem}.rest-deeper-evidence>summary{cursor:pointer;font-weight:800}.rest-deeper-evidence p{margin:.65rem 0;color:var(--muted)}
.rest-artifacts{display:flex;flex-wrap:wrap;gap:.45rem}.rest-artifacts .button{min-height:40px;padding:.5rem .7rem}
.rest-operation-panel{padding:1rem}.rest-operation-header{padding-bottom:1rem;border-bottom:1px solid var(--line)}
.rest-operation-header>p:last-child{max-width:68ch;color:var(--muted)}
.rest-operation-title{display:flex;flex-wrap:wrap;gap:.65rem;align-items:center;margin-bottom:.65rem}
.rest-operation-header h2{margin-bottom:.5rem;font-size:clamp(1.4rem,2.8vw,2rem)}
.rest-task-block{min-width:0;padding-top:1rem}.rest-task-block+.rest-task-block{margin-top:1rem;border-top:1px solid var(--line)}
.rest-task-block h3{margin-bottom:.8rem;font:850 .78rem/1.3 var(--mono);letter-spacing:.06em;text-transform:uppercase}
.rest-task-block h4{margin:1rem 0 .55rem;color:var(--muted);font:800 .72rem/1.4 var(--mono);letter-spacing:.05em;text-transform:uppercase}
.openapi-inputs{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:.75rem;margin-bottom:.8rem}.openapi-inputs label{display:grid;gap:.3rem;min-width:0}.openapi-inputs .openapi-body{grid-column:1/-1}
.openapi-inputs input,.openapi-inputs textarea{min-width:0}.openapi-inputs textarea{min-height:8rem;resize:vertical}
.parameter-meta{color:var(--muted);font-size:.78rem;font-weight:500}.rest-task-block form{margin:0}
.rest-response dl{grid-template-columns:minmax(6rem,.28fr) minmax(0,1fr)}.rest-response dd{min-width:0}.rest-response pre,.rest-code-samples pre{max-width:100%;max-height:20rem;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere}
.rest-contract-schema{min-width:0;padding:.75rem 0}.rest-contract-schema+.rest-contract-schema{border-top:1px solid var(--line)}.rest-contract-schema p{color:var(--muted)}
.rest-code-samples{border:1px solid var(--line)}.rest-code-samples>summary{padding:.75rem;cursor:pointer}.rest-code-samples-body{padding:.75rem;border-top:1px solid var(--line)}
.api-subheading{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.6rem;align-items:center}.api-tabs{display:flex;flex-wrap:wrap;gap:.25rem}.api-tabs button[aria-selected="true"]{box-shadow:inset 0 -2px 0 var(--acid)}
@media(max-width:900px){.rest-operation-browser{grid-template-columns:minmax(0,1fr)}.rest-operation-picker{position:static}.rest-operation-choices{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.rest-operation-choices{grid-template-columns:minmax(0,1fr)}.rest-response dl{grid-template-columns:minmax(0,1fr)}}
</style>`;

export function apiContent(env: Env): PageContent {
  const restUrl = `${routeUrl('demos.index')}#rest`;
  const contract = openApiConsole(routeUrl('interfaces.rest.openapi.json'));
  return pageContent(env, 'REST API', `
<section class="page-header lab-page-header api-page-header">
  <h1>REST API</h1>
  <p class="lede">Choose one operation, run it, inspect the actual response, then compare that behavior with the matching OpenAPI contract.</p>
</section>
<aside class="assurance-notice" aria-label="REST API boundary">
  <strong>Focused browser tutorial.</strong> These operations use the anonymous signed-cookie visitor API at <code>/api/labs/rest-demo-records</code>. The separate bearer-capable machine API remains documented by <code>/api/openapi.json</code>.
</aside>
${contract}
${restContainmentStyles}`, {
    canonicalPath: restUrl,
    description: 'Run one live REST operation at a time and compare it with the relevant OpenAPI contract.',
    cacheControl: 'no-store',
  });
}
