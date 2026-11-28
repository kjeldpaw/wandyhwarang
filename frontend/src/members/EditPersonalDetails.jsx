import { useTranslation } from 'react-i18next';
import ApiErrorMessage from '../api/ApiErrorMessage';
import { useWrite } from '../api/useWrite';
import MemberForm from './MemberForm';
import { fullName } from './member';

/**
 * The card for editing a Member's personal details, used for /members/:id/edit and the Profile.
 * The email is read-only, as it is the Keycloak login; `emailHint` describes it.
 * `save(values)` writes the valid form values; its failure shows on the form. `cancel` (a link
 * or button) goes below the form. `role` adds MemberForm's Role select.
 */
export default function EditPersonalDetails({ member, emailHint, role, save, cancel }) {
  const { t } = useTranslation();
  const { busy, error, run } = useWrite();
  return (
    <section className="card form-page">
      <h2>{t('members.form.editTitle', { name: fullName(member) })}</h2>
      <MemberForm
        initial={member}
        emailReadOnly
        emailHint={emailHint}
        role={role}
        submitLabel={t('app.save')}
        onSubmit={(values) => run(() => save(values))}
        busy={busy}
      >
        <ApiErrorMessage error={error} />
      </MemberForm>
      <p className="page-actions">{cancel}</p>
    </section>
  );
}
