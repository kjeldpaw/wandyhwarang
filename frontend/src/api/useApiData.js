import { useEffect, useState } from 'react';
import { useApi } from './ApiProvider';

/**
 * Loads data with the API client when the component mounts or `deps` change.
 *   const { data, error, loading } = useApiData((api) => api.clubs.list(), []);
 * `error` is an ApiError (see api/client.js); render it with <ApiErrorMessage error={error} />.
 */
export function useApiData(load, deps) {
  const api = useApi();
  const [state, setState] = useState({ data: undefined, error: undefined, loading: true });

  useEffect(() => {
    let current = true;
    setState((previous) => ({ ...previous, loading: true }));
    load(api).then(
      (data) => current && setState({ data, error: undefined, loading: false }),
      (error) => current && setState({ data: undefined, error, loading: false }),
    );
    return () => {
      current = false;
    };
  }, [api, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
