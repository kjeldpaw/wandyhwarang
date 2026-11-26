// The browser's preferred languages (navigator.languages), which the app's language
// detection reads. setup.js pins them to Danish before every test; a test that is about
// language detection sets its own with setBrowserLanguages(['de-DE', 'en']).
let browserLanguages = ['da-DK', 'da'];

Object.defineProperty(window.navigator, 'languages', { configurable: true, get: () => browserLanguages });
Object.defineProperty(window.navigator, 'language', { configurable: true, get: () => browserLanguages[0] });

export function setBrowserLanguages(languages) {
  browserLanguages = languages;
}
