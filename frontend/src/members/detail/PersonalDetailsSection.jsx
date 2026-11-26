import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSession } from '../../auth/useSession';
import { useFormatDate } from '../../i18n/formatDate';
import Section from './Section';

/** Name is the page heading; this shows address, phone, email and date of birth. */
export default function PersonalDetailsSection({ member }) {
  const { t } = useTranslation();
  const formatDate = useFormatDate();
  const { address } = member;
  const { isInstructor } = useSession();
  const missing = t('members.detail.notGiven');
  const edit = isInstructor && <Link to={`/members/${member.id}/edit`}>{t('members.form.edit')}</Link>;
  return (
    <Section title={t('members.detail.personal')} actions={edit}>
      <dl>
        <dt>{t('members.fields.address')}</dt>
        <dd>
          {address.street}, {address.zipCode} {address.city}
        </dd>
        <dt>{t('members.fields.phone')}</dt>
        <dd>{member.phone || missing}</dd>
        <dt>{t('members.fields.email')}</dt>
        <dd>{member.email}</dd>
        <dt>{t('members.fields.dateOfBirth')}</dt>
        <dd>{member.dateOfBirth ? formatDate(member.dateOfBirth) : missing}</dd>
      </dl>
    </Section>
  );
}
