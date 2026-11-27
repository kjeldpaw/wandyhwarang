import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ApiErrorMessage from '../../api/ApiErrorMessage';
import { useApi } from '../../api/ApiProvider';
import { useWrite } from '../../api/useWrite';
import { useSession } from '../../auth/useSession';
import { beltName } from '../../belts/belt';
import { useFormatDate } from '../../i18n/formatDate';
import { byName, currentBelt, fullName, graduationHistory } from '../member';
import GraduationForm from './GraduationForm';
import Section from './Section';

/**
 * The current Belt and the Graduation history, latest first, with the Examiners' names.
 * Instructors and Admins can add a Graduation here, and correct or delete (after confirming)
 * one in the history. One form or confirmation is open at a time.
 */
export default function GraduationsSection({ member, onChange }) {
  const { t } = useTranslation();
  const api = useApi();
  const { isInstructor } = useSession();
  const formatDate = useFormatDate();
  const history = graduationHistory(member);
  const belt = currentBelt(member);
  // What's open: nothing, { adding }, { editing: graduation } or { deleting: graduation }.
  const [open, setOpen] = useState({});
  const removal = useWrite();
  const close = () => setOpen({});
  const openOnly = (next) => {
    removal.reset();
    setOpen(next);
  };

  async function add(body) {
    onChange(await api.graduations.add(member.id, body));
    close();
  }

  async function update(body) {
    onChange(await api.graduations.update(member.id, open.editing.id, body));
    close();
  }

  const remove = () =>
    removal.run(async () => {
      onChange(await api.graduations.remove(member.id, open.deleting.id));
      close();
    });

  const actions = isInstructor && !open.adding && (
    <button type="button" onClick={() => openOnly({ adding: true })}>
      {t('members.graduation.add')}
    </button>
  );

  return (
    <Section title={t('members.detail.graduations')} actions={actions}>
      <p>
        {t('members.detail.currentBelt')}: {belt ? beltName(belt) : t('members.detail.noBelt')}
      </p>
      {open.adding && <GraduationForm title={t('members.graduation.new')} onSave={add} onCancel={close} />}
      {open.editing && (
        <GraduationForm
          key={open.editing.id}
          title={t('members.graduation.editTitle')}
          graduation={open.editing}
          onSave={update}
          onCancel={close}
        />
      )}
      {open.deleting && (
        <div>
          <p>
            {t('members.graduation.deleteConfirm', {
              date: formatDate(open.deleting.date),
              belt: beltName(open.deleting.belt),
            })}
          </p>
          <ApiErrorMessage error={removal.error} />
          <button type="button" disabled={removal.busy} onClick={remove}>
            {t('members.graduation.confirmDelete')}
          </button>
          <button type="button" disabled={removal.busy} onClick={close}>
            {t('app.cancel')}
          </button>
        </div>
      )}
      {history.length === 0 ? (
        <p>{t('members.detail.noGraduations')}</p>
      ) : (
        <table aria-label={t('members.detail.graduationHistory')}>
          <thead>
            <tr>
              <th scope="col">{t('members.graduation.date')}</th>
              <th scope="col">{t('members.graduation.belt')}</th>
              <th scope="col">{t('members.graduation.examiners')}</th>
              {isInstructor && <th scope="col">{t('members.graduation.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {history.map((graduation) => (
              <tr key={graduation.id}>
                <td>{formatDate(graduation.date)}</td>
                <td>{beltName(graduation.belt)}</td>
                <td>{[...graduation.graduatedBy].sort(byName).map(fullName).join(', ')}</td>
                {isInstructor && (
                  <td>
                    <button
                      type="button"
                      aria-label={t('members.graduation.editOne', { date: formatDate(graduation.date) })}
                      onClick={() => openOnly({ editing: graduation })}
                    >
                      {t('members.graduation.edit')}
                    </button>{' '}
                    <button
                      type="button"
                      aria-label={t('members.graduation.deleteOne', { date: formatDate(graduation.date) })}
                      onClick={() => openOnly({ deleting: graduation })}
                    >
                      {t('members.graduation.delete')}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}
