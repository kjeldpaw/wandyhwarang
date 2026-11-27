import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../api/ApiProvider';
import { useWrite } from '../../api/useWrite';
import { useSession } from '../../auth/useSession';
import { fullName } from '../member';
import ConfirmPanel from './ConfirmPanel';

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
  const { busy, error, run } = useWrite();

  const remove = () =>
    run(async () => {
      await api.members.remove(member.id);
      navigate('/');
    });

  return (
    <div className="delete-member">
      {confirming ? (
        <ConfirmPanel
          message={t('members.delete.confirm', { name: fullName(member) })}
          confirmLabel={t('members.delete.confirmButton')}
          busy={busy}
          error={error}
          onConfirm={remove}
          onCancel={() => setConfirming(false)}
        />
      ) : (
        <button type="button" className="btn-danger" onClick={() => setConfirming(true)}>
          {t('members.delete.button')}
        </button>
      )}
    </div>
  );
}
