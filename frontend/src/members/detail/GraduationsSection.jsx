import { useTranslation } from 'react-i18next';
import { beltName } from '../../belts/belt';
import { useFormatDate } from '../../i18n/formatDate';
import { byName, currentBelt, fullName, graduationHistory } from '../member';
import Section from './Section';

/** The current Belt and the Graduation history, latest first, with the Examiners' names. */
export default function GraduationsSection({ member }) {
  const { t } = useTranslation();
  const formatDate = useFormatDate();
  const history = graduationHistory(member);
  const belt = currentBelt(member);
  return (
    <Section title={t('members.detail.graduations')}>
      <p>
        {t('members.detail.currentBelt')}: {belt ? beltName(belt) : t('members.detail.noBelt')}
      </p>
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
