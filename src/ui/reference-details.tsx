import { useRequestLocalization } from './document';
import type { ReferenceLink } from './page';

export function ReferenceDetails({
  links,
  label = 'References',
}: Readonly<{ links: readonly ReferenceLink[]; label?: string }>) {
  const localization = useRequestLocalization();
  if (links.length === 0) return null;
  return <details className="reference-details">
    <summary>{localization.exact(label)}</summary>
    <div className="reference-links">
      {links.map((link) => <a key={`${link.label}-${link.href}`} href={link.href}>
        {localization.exact(link.label)}
        {link.accessibleSuffix ? <span className="sr-only">: {link.accessibleSuffix}</span> : null}
      </a>)}
    </div>
  </details>;
}
