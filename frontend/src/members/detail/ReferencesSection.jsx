import { useTranslation } from 'react-i18next';
import Section from './Section';

// Reference types are names, not translated.
export const REFERENCE_TYPES = { WandyWhaRang: 'Wandy Wha Rang', KukkiWon: 'Kukkiwon' };

/** The Member's References (Wandy Wha Rang and Kukkiwon numbers). */
export default function ReferencesSection({ member }) {
  const { t } = useTranslation();
  const references = member.references ?? [];
  return (
    <Section title={t('members.detail.references')}>
      {references.length === 0 ? (
        <p>{t('members.detail.noReferences')}</p>
      ) : (
        <dl>
          {references.map((reference) => (
            <div key={reference.id}>
              <dt>{REFERENCE_TYPES[reference.type] ?? reference.type}</dt>
              <dd>{reference.reference}</dd>
            </div>
          ))}
        </dl>
      )}
    </Section>
  );
}
