import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../api/ApiProvider';
import { useWrite } from '../../api/useWrite';
import { useSession } from '../../auth/useSession';
import { beltName } from '../../belts/belt';
import { useFormatDate } from '../../i18n/formatDate';
import { byName, currentBelt, fullName, graduationHistory } from '../member';
import ConfirmPanel from './ConfirmPanel';
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
  // The open panel: null | { kind: 'add' } | { kind: 'edit', id } | { kind: 'delete', id }.
  const [panel, setPanel] = useState(null);
  const chosen = panel?.id && history.find((graduation) => graduation.id === panel.id);
  const removal = useWrite();
  const close = () => setPanel(null);
  const start = (next) => {
    removal.reset();
    setPanel(next);
  };

  async function add(body) {
    onChange(await api.graduations.add(member.id, body));
    close();
  }

  async function update(body) {
    onChange(await api.graduations.update(member.id, panel.id, body));
    close();
  }

  const remove = () =>
    removal.run(async () => {
      onChange(await api.graduations.remove(member.id, panel.id));
      close();
    });

  const actions = isInstructor && panel?.kind !== 'add' && (
    <button type="button" onClick={() => start({ kind: 'add' })}>
      {t('members.graduation.add')}
    </button>
  );

  return (
    <Section title={t('members.detail.graduations')} actions={actions}>
      <p className="current-belt">
        {t('members.detail.currentBelt')}: {belt ? beltName(belt) : t('members.detail.noBelt')}
      </p>
      {panel?.kind === 'add' && <GraduationForm title={t('members.graduation.new')} onSave={add} onCancel={close} />}
      {panel?.kind === 'edit' && chosen && (
        <GraduationForm
          key={chosen.id}
          title={t('members.graduation.editTitle')}
          graduation={chosen}
          onSave={update}
          onCancel={close}
        />
      )}
      {panel?.kind === 'delete' && chosen && (
        <ConfirmPanel
          message={t('members.graduation.deleteConfirm', {
            date: formatDate(chosen.date),
            belt: beltName(chosen.belt),
          })}
          confirmLabel={t('members.graduation.confirmDelete')}
          busy={removal.busy}
          error={removal.error}
          onConfirm={remove}
          onCancel={close}
        />
      )}
      {history.length === 0 ? (
        <p className="empty">{t('members.detail.noGraduations')}</p>
      ) : (
        <table aria-label={t('members.detail.graduationHistory')} className="data-table">
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
                  <td className="actions">
                    <button
                      type="button"
                      className="btn-edit btn-small"
                      aria-label={t('members.graduation.editOne', { date: formatDate(graduation.date) })}
                      onClick={() => start({ kind: 'edit', id: graduation.id })}
                    >
                      {t('members.graduation.edit')}
                    </button>{' '}
                    <button
                      type="button"
                      className="btn-danger btn-small"
                      aria-label={t('members.graduation.deleteOne', { date: formatDate(graduation.date) })}
                      onClick={() => start({ kind: 'delete', id: graduation.id })}
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
