import { parseControlledSubject } from './controlled-pr-identity.ts';
import { RELEASE_INTENT_PATTERN } from './release-intent.ts';

export const controlledSections = ['Change', 'Reason', 'Impact', 'Risk', 'Controls', 'Validation', 'Evidence', 'Source', 'Release'];
export const normalizeControlledBody = (body: string): string => body.replaceAll('\r\n', '\n').split('\n').map((line) => line.trimEnd()).join('\n').trim();

export interface ControlledRecord {
  id: string;
  type: string;
  summary: string;
  change: string;
  reason: string;
  impact: string;
  risk: 'Low' | 'Medium' | 'High';
  controls: string;
  validation: string;
  evidence: string;
  source: string;
  release: string;
  rollback?: string;
  maintenance?: boolean;
  releaseIntent?: string;
  requestId?: string;
}

export function validateControlledRecord(subject: string, body: string): string[] {
  const errors: string[] = [];
  if (!parseControlledSubject(subject) || subject.includes('\n') || subject.trim() !== subject) errors.push('Invalid controlled subject or PR suffix.');
  const normalized = normalizeControlledBody(body);
  if (/^\[DEMO-\d+\]/m.test(normalized)) errors.push('Controlled body must not duplicate the subject.');
  const headings = [...normalized.matchAll(/^([A-Z][A-Za-z-]*):[ \t]*(.*)$/gm)];
  const content = (section: string): string[] => headings.flatMap((heading, index) => heading[1] === section
    ? [(heading[2] + '\n' + normalized.slice(heading.index! + heading[0].length, headings[index + 1]?.index ?? normalized.length)).trim()]
    : []);
  for (const section of controlledSections) {
    const values = content(section);
    if (values.length !== 1 || !values[0]) errors.push(`Controlled record requires one nonempty ${section}: section.`);
  }
  const risk = content('Risk')[0];
  if (!['Low', 'Medium', 'High'].includes(risk)) errors.push('Controlled record requires Low, Medium, or High risk.');
  if (risk === 'High' && !content('Rollback')[0]) errors.push('High risk requires an explicit forward recovery or rollback target.');
  if (/^Post-Merge-Recovery:/m.test(normalized)) errors.push('Same-ID recovery is retired.');
  if (RELEASE_INTENT_PATTERN.test(normalized) && !/^Portfolio-Plan-Maintenance: true$/m.test(normalized)) errors.push('Release-Intent belongs to a plan-maintenance record.');
  const correlation = [...normalized.matchAll(/<!-- git-demo-request:([^]*?) -->/g)];
  if (correlation.length > 1 || (correlation.length && !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(correlation[0][1]))) errors.push('Invalid or repeated request correlation.');
  return errors;
}

export function renderControlledRecord(record: ControlledRecord): { subject: string; body: string; commit: string } {
  const subject = `[${record.id}] [${record.type}] ${record.summary}`;
  let body = controlledSections.map((section) => `${section}:\n${record[section.toLowerCase()] ?? ''}`).join('\n\n');
  if (record.rollback) body += `\n\nRollback:\n${record.rollback}`;
  if (record.maintenance) body += '\n\nPortfolio-Plan-Maintenance: true';
  if (record.releaseIntent) body += `\n\nRelease-Intent: v${record.releaseIntent}`;
  if (record.requestId) body += `\n\n<!-- git-demo-request:${record.requestId} -->`;
  body = normalizeControlledBody(body);
  const errors = validateControlledRecord(subject, body);
  if (errors.length) throw new Error(errors.join('\n'));
  return { subject, body, commit: `${subject}\n\n${body}\n` };
}

export function requireMatchingRecord(subject: string, body: string, title: string, prBody: string): void {
  const errors = validateControlledRecord(subject, body);
  if (title !== subject || normalizeControlledBody(prBody) !== normalizeControlledBody(body)) errors.push('PR title/body drifted from the exact-head controlled record.');
  if (errors.length) throw new Error(errors.join('\n'));
}
