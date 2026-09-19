import { parseSync, Visitor } from 'oxc-parser';

const canonicalPageSegments = ['demos', 'assurance', 'operations', 'security'];

function isCanonicalPageLiteral(value) {
  return canonicalPageSegments.some((segment) => {
    const root = `/${segment}`;
    return value === root || value.startsWith(`${root}/`) || value.startsWith(`${root}?`) || value.startsWith(`${root}#`);
  });
}

function lineNumberAt(text, offset) {
  return text.slice(0, offset).split(/\r?\n/).length;
}

export function findCanonicalPageLiteral(file, text) {
  const { program } = parseSync(file, text);
  let failure;

  function inspect(value, start) {
    if (failure || !isCanonicalPageLiteral(value)) return;
    const line = lineNumberAt(text, start);
    failure = `${file}:${line} canonical pathname literal outside a route declaration; use routeUrl(routeId) or move deliberate dead-route data under tests/fixtures/; rerun: npm run lint`;
  }

  new Visitor({
    Literal(node) {
      if (typeof node.value === 'string') inspect(node.value, node.start);
    },
    TemplateLiteral(node) {
      if (node.expressions.length !== 0 || node.quasis.length !== 1) return;
      const value = node.quasis[0].value.cooked ?? node.quasis[0].value.raw;
      inspect(value, node.start);
    },
  }).visit(program);

  return failure;
}
