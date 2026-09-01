export function graphqlConsole(): string {
  return `<section class="api-heading" id="graphql" aria-labelledby="graphql-heading"><div><p class="eyebrow">GraphQL / live IDE</p><h2 id="graphql-heading">GraphiQL over the D1 users</h2></div><a href="/graphql/schema">Schema</a></section>
<section class="panel"><p>The embedded IDE executes a real GraphQL schema through GraphQL Yoga. Query and mutate the same visitor-scoped users shown on <a href="/d1">/d1</a>.</p>
<div class="graphql-frame"><iframe title="GraphiQL query editor" src="/graphql" loading="lazy"></iframe></div>
<p class="subtle">The IDE loads only when this section is viewed. GraphQL execution, validation, D1 persistence, and errors remain Worker controlled.</p></section>`;
}
