import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSession } from '../../auth/useSession';
import { useFormatDate } from '../../i18n/formatDate';
import Section from './Section';

/**
 * Name is the page heading; this shows address, phone, email and date of birth.
 * `editAction` replaces the Edit link Instructors and Admins get to /members/:id/edit, e.g.
 * with the Profile's own Edit button.
 */
export default function PersonalDetailsSection({ member, editAction }) {
  const { t } = useTranslation();
  const formatDate = useFormatDate();
  const { address } = member;
  const { isInstructor } = useSession();
  const missing = t('members.detail.notGiven');
  const edit = isInstructor && (
    <Link to={`/members/${member.id}/edit`} className="btn btn-secondary">
      {t('members.form.edit')}
    </Link>
  );
  return (
    <Section title={t('members.detail.personal')} actions={editAction ?? edit}>
      <dl className="details">
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
