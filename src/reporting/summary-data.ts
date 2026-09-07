import accessClasses from '../../assurance/governance/access-classes.json';
import accessReviews from '../../assurance/governance/access-reviews.json';
import assetInventory from '../../assurance/governance/asset-inventory.json';
import awareness from '../../assurance/governance/awareness.json';
import competence from '../../assurance/governance/competence.json';
import configuration from '../../assurance/governance/configuration.json';
import cryptographySecrets from '../../assurance/governance/cryptography-secrets.json';
import dataInventory from '../../assurance/governance/data-inventory.json';
import dataRetention from '../../assurance/governance/data-retention.json';
import obligations from '../../assurance/governance/obligations.json';
import recoveryTests from '../../assurance/governance/recovery-tests.json';
import securityMaintenance from '../../assurance/governance/security-maintenance.json';
import securityTesting from '../../assurance/governance/security-testing.json';
import suppliers from '../../assurance/governance/suppliers.json';

const documents = new Map<string, unknown>([
  ['assurance/governance/access-classes.json', accessClasses],
  ['assurance/governance/access-reviews.json', accessReviews],
  ['assurance/governance/asset-inventory.json', assetInventory],
  ['assurance/governance/awareness.json', awareness],
  ['assurance/governance/competence.json', competence],
  ['assurance/governance/configuration.json', configuration],
  ['assurance/governance/cryptography-secrets.json', cryptographySecrets],
  ['assurance/governance/data-inventory.json', dataInventory],
  ['assurance/governance/data-retention.json', dataRetention],
  ['assurance/governance/obligations.json', obligations],
  ['assurance/governance/recovery-tests.json', recoveryTests],
  ['assurance/governance/security-maintenance.json', securityMaintenance],
  ['assurance/governance/security-testing.json', securityTesting],
  ['assurance/governance/suppliers.json', suppliers],
]);

export function reportingSummaryDocument(path: string): unknown | undefined {
  return documents.get(path);
}
