import { useTranslation } from 'react-i18next';
import { sortClubs } from '../member';
import Section from './Section';

/** The Clubs the Member belongs to, by name. */
export default function ClubsSection({ member }) {
  const { t } = useTranslation();
  return (
    <Section title={t('members.detail.clubs')}>
      <ul>
        {sortClubs(member.clubs).map((club) => (
          <li key={club.id}>{club.name}</li>
        ))}
      </ul>
    </Section>
  );
}
