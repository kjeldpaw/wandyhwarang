import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../api/ApiProvider';
import { useWrite } from '../../api/useWrite';
import { useSession } from '../../auth/useSession';
import { beltName } from '../../belts/belt';
import BeltBadge from '../../belts/BeltBadge';
import { useFormatDate } from '../../i18n/formatDate';
import { byName, currentBelt, fullName, graduationHistory } from '../member';
import ConfirmPanel from './ConfirmPanel';
import GraduationForm from './GraduationForm';
import Section from './Section';

/**
 * The current Belt and the Graduation history, latest first, with the Examiners' names.
 * Instructors and Admins can add a Graduation here, and correct or delete (after confirming)
 * one in the history. One form or confirmation is open at a time. `readOnly` (on /profile) shows
 * them to everyone without changes.
 */
export default function GraduationsSection({ member, onChange, readOnly = false }) {
  const { t } = useTranslation();
  const api = useApi();
  const canEdit = useSession().isInstructor && !readOnly;
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

  const actions = canEdit && panel?.kind !== 'add' && (
    <button type="button" className="btn-secondary" onClick={() => start({ kind: 'add' })}>
      {t('members.graduation.add')}
    </button>
  );

  return (
    <Section title={t('members.detail.graduations')} actions={actions}>
      <p className="current-belt">
        {belt && <BeltBadge belt={belt} large />}
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
              {canEdit && <th scope="col">{t('members.graduation.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {history.map((graduation) => (
              <tr key={graduation.id}>
                <td>{formatDate(graduation.date)}</td>
                <td>
                  <span className="belt-name">
                    <BeltBadge belt={graduation.belt} />
                    {beltName(graduation.belt)}
                  </span>
                </td>
                <td>{[...graduation.graduatedBy].sort(byName).map(fullName).join(', ')}</td>
                {canEdit && (
                  <td className="actions">
                    <button
                      type="button"
                      className="btn-secondary btn-small"
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
