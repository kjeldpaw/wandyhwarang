import da from './locales/da.json';
import de from './locales/de.json';
import en from './locales/en.json';

// Every text the UI shows exists in all three languages; Danish is the reference.
const keysOf = (resource, prefix = '') =>
  Object.entries(resource).flatMap(([key, value]) =>
    typeof value === 'object' ? keysOf(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );

test.each([
  ['en', en],
  ['de', de],
])('%s has exactly the keys of da', (_, resource) => {
  expect(keysOf(resource).sort()).toEqual(keysOf(da).sort());
});

test.each([
  ['da', da],
  ['en', en],
  ['de', de],
])('%s has no empty texts', (_, resource) => {
  const empty = keysOf(resource).filter((key) => !key.split('.').reduce((node, part) => node[part], resource).trim());
  expect(empty).toEqual([]);
});
