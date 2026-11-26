import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../api/ApiProvider';
import ApiErrorMessage from '../../api/ApiErrorMessage';
import { useSession } from '../../auth/useSession';
import { fullName } from '../member';

/**
 * Admin only: deletes the Member after confirming, then returns to the Member list.
 * member-service also deletes their login, References and Graduation history.
 */
export default function DeleteMember({ member }) {
  const session = useSession();
  if (!session.isAdmin) return null;
  return <DeleteAction member={member} />;
}

function DeleteAction({ member }) {
  const { t } = useTranslation();
  const api = useApi();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState();

  async function remove() {
    setBusy(true);
    setError(undefined);
    try {
      await api.members.remove(member.id);
      navigate('/');
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  }

  return (
    <div>
      {confirming ? (
        <p>
          {t('members.delete.confirm', { name: fullName(member) })}{' '}
          <button type="button" disabled={busy} onClick={remove}>
            {t('members.delete.confirmButton')}
          </button>{' '}
          <button type="button" disabled={busy} onClick={() => setConfirming(false)}>
            {t('members.delete.cancel')}
          </button>
        </p>
      ) : (
        <button type="button" onClick={() => setConfirming(true)}>
          {t('members.delete.button')}
        </button>
      )}
      <ApiErrorMessage error={error} />
    </div>
  );
}
