import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync('config/i18n.json', 'utf8'));
const failures = [];
const resources = new Map();

for (const locale of config.supportedLocales) {
  const path = `src/i18n/locales/${locale}.json`;
  if (!fs.existsSync(path)) {
    failures.push(`missing locale resource: ${path}`);
    continue;
  }
  resources.set(locale, JSON.parse(fs.readFileSync(path, 'utf8')));
}

const fallback = resources.get(config.fallbackLocale);
if (!fallback) failures.push(`fallback locale is unavailable: ${config.fallbackLocale}`);
else {
  const expected = Object.keys(fallback).sort();
  for (const [locale, messages] of resources) {
    const actual = Object.keys(messages).sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push(`${locale} keys differ from ${config.fallbackLocale}`);
    for (const [key, value] of Object.entries(messages)) if (typeof value !== 'string' || !value.trim()) failures.push(`${locale}.${key} must be a non-empty string`);
  }
}

for (const locale of config.rtlLocales) if (!config.supportedLocales.includes(locale)) failures.push(`RTL locale is not supported: ${locale}`);

if (failures.length) {
  console.error('Localization validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`Localization validation passed: ${resources.size} locales with ${Object.keys(fallback).length} synchronized keys.`);
