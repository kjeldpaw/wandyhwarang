import { formatDate } from './formatDate';

// Dates from member-service are ISO dates (yyyy-mm-dd) without a time zone.
test.each([
  ['da', '3. marts 2024'],
  ['en', '3 March 2024'],
  ['de', '3. März 2024'],
])('an ISO date is written out in %s', (language, expected) => {
  expect(formatDate('2024-03-03', language)).toBe(expected);
});

test('the date does not shift with the time zone', () => {
  expect(formatDate('2024-01-01', 'da')).toBe('1. januar 2024');
  expect(formatDate('2023-12-31', 'en')).toBe('31 December 2023');
});

test('a missing date is shown as nothing', () => {
  expect(formatDate(undefined, 'da')).toBe('');
});
