import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../api/ApiProvider';
import { useSession } from '../../auth/useSession';
import { beltName } from '../../belts/belt';
import { useFormatDate } from '../../i18n/formatDate';
import { byName, currentBelt, fullName, graduationHistory } from '../member';
import GraduationForm from './GraduationForm';
import Section from './Section';

/**
 * The current Belt and the Graduation history, latest first, with the Examiners' names.
 * Instructors and Admins can add a Graduation here.
 */
export default function GraduationsSection({ member, onChange }) {
  const { t } = useTranslation();
  const api = useApi();
  const { isInstructor } = useSession();
  const formatDate = useFormatDate();
  const history = graduationHistory(member);
  const belt = currentBelt(member);
  const [adding, setAdding] = useState(false);

  async function add(body) {
    onChange(await api.graduations.add(member.id, body));
    setAdding(false);
  }

  const actions = isInstructor && !adding && (
    <button type="button" onClick={() => setAdding(true)}>
      {t('members.graduation.add')}
    </button>
  );

  return (
    <Section title={t('members.detail.graduations')} actions={actions}>
      <p>
        {t('members.detail.currentBelt')}: {belt ? beltName(belt) : t('members.detail.noBelt')}
      </p>
      {adding && (
        <GraduationForm title={t('members.graduation.new')} onSave={add} onCancel={() => setAdding(false)} />
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
            </tr>
          </thead>
          <tbody>
            {history.map((graduation) => (
              <tr key={graduation.id}>
                <td>{formatDate(graduation.date)}</td>
                <td>{beltName(graduation.belt)}</td>
                <td>{[...graduation.graduatedBy].sort(byName).map(fullName).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}
