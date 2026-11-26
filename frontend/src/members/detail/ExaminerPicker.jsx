import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../api/ApiProvider';
import ApiErrorMessage from '../../api/ApiErrorMessage';
import { byName, fullName } from '../member';

// member-service answers 400 to a shorter query, so the picker waits for this many characters.
const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;

/**
 * Picks one or more Examiners, from any Club, by searching member-service's Examiner lookup
 * by name. It only ever shows names. `value` and `onChange` hold the chosen Examiners
 * ({id, firstName, lastName}[]).
 */
export default function ExaminerPicker({ value, onChange, invalid, describedBy }) {
  const { t } = useTranslation();
  const api = useApi();
  const searchId = useId();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState({ results: undefined, error: undefined });

  const text = query.trim();
  useEffect(() => {
    if (text.length < MIN_QUERY) {
      setSearch({ results: undefined, error: undefined });
      return undefined;
    }
    let current = true;
    const timer = setTimeout(() => {
      api.examiners.search(text).then(
        (results) => current && setSearch({ results, error: undefined }),
        (error) => current && setSearch({ results: undefined, error }),
      );
    }, DEBOUNCE_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [api, text]);

  const chosen = new Set(value.map((examiner) => examiner.id));
  const results = search.results?.filter((examiner) => !chosen.has(examiner.id));

  const add = (examiner) => {
    onChange([...value, { id: examiner.id, firstName: examiner.firstName, lastName: examiner.lastName }]);
    setQuery('');
  };
  const remove = (examiner) => onChange(value.filter((other) => other.id !== examiner.id));

  return (
    <fieldset aria-invalid={invalid || undefined} aria-describedby={describedBy}>
      <legend>{t('members.graduation.examiners')}</legend>
      {value.length === 0 ? (
        <p>{t('members.graduation.noExaminers')}</p>
      ) : (
        <ul aria-label={t('members.graduation.chosenExaminers')}>
          {[...value].sort(byName).map((examiner) => (
            <li key={examiner.id}>
              {fullName(examiner)}{' '}
              <button type="button" onClick={() => remove(examiner)}>
                {t('members.graduation.removeExaminer', { name: fullName(examiner) })}
              </button>
            </li>
          ))}
        </ul>
      )}
      <label htmlFor={searchId}>{t('members.graduation.searchExaminer')}</label>
      <input
        id={searchId}
        type="search"
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {text.length > 0 && text.length < MIN_QUERY && <p>{t('members.graduation.typeMore')}</p>}
      <ApiErrorMessage error={search.error} />
      {results &&
        (results.length === 0 ? (
          <p>{t('members.graduation.noExaminersFound')}</p>
        ) : (
          <ul aria-label={t('members.graduation.searchResults')}>
            {results.map((examiner) => (
              <li key={examiner.id}>
                <button type="button" onClick={() => add(examiner)}>
                  {fullName(examiner)}
                </button>
              </li>
            ))}
          </ul>
        ))}
    </fieldset>
  );
}
