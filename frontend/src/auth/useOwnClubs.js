import { useApiData } from '../api/useApiData';
import { useSession } from './useSession';

/**
 * The Clubs the logged-in person works with: an Admin any Club, anyone else the Clubs of
 * their own Member record (member-service answers 403 to an Instructor's write in any other).
 * Used for the Member list's Club filter, a new Member's Clubs and the Clubs an Instructor
 * may add to or remove from a Member. Returns useApiData's { data, error, loading }.
 */
export function useOwnClubs() {
  const { isAdmin, memberId } = useSession();
  return useApiData(
    (api) => (isAdmin ? api.clubs.list() : api.members.get(memberId).then((own) => own.clubs)),
    [isAdmin, memberId],
  );
}
