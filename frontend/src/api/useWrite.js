import { useCallback, useState } from 'react';

/**
 * Runs one write to member-service at a time and remembers how it went.
 *   const { busy, error, run, reset } = useWrite();
 *   run(async () => onChange(await api.members.addClub(id, clubId)));
 * `run(write)` clears the last error, sets `busy` while `write()` runs and keeps its
 * rejection (an ApiError) in `error`; it resolves true on success, false on failure.
 * Disable the write's buttons while `busy`, show `error` with <ApiErrorMessage>, and call
 * `reset()` to clear the error, e.g. when the person opens another form.
 */
export function useWrite() {
  const [state, setState] = useState({ busy: false, error: undefined });

  const run = useCallback(async (write) => {
    setState({ busy: true, error: undefined });
    try {
      await write();
      setState({ busy: false, error: undefined });
      return true;
    } catch (error) {
      setState({ busy: false, error });
      return false;
    }
  }, []);

  const reset = useCallback(() => setState({ busy: false, error: undefined }), []);
  return { ...state, run, reset };
}
