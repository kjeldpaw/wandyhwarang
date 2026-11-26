import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ApiErrorMessage from '../../api/ApiErrorMessage';
import { useApiData } from '../../api/useApiData';
import { beltName, sortBelts } from '../../belts/belt';
import ExaminerPicker from './ExaminerPicker';

/**
 * Date, Belt and Examiners of a Graduation, for adding a new one or correcting one.
 * `graduation` (optional) fills the form. `onSave({date, beltId, graduatedBy})` sends it
 * to member-service and resolves when done; a rejection (ApiError) is shown in the form.
 * member-service doesn't require an Examiner, so the form does (decisions: wandyhwarang#1).
 */
export default function GraduationForm({ title, graduation, onSave, onCancel }) {
  const { t } = useTranslation();
  const ids = { date: useId(), belt: useId(), errors: useId() };
  const belts = useApiData((api) => api.belts.list(), []);
  const [date, setDate] = useState(graduation?.date ?? '');
  const [beltId, setBeltId] = useState(graduation?.belt.id ?? '');
  const [examiners, setExaminers] = useState(graduation?.graduatedBy ?? []);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState();

  const problems = {
    date: !date && t('members.graduation.dateRequired'),
    belt: !beltId && t('members.graduation.beltRequired'),
    examiners: examiners.length === 0 && t('members.graduation.examinerRequired'),
  };
  const shown = submitted ? problems : {};

  async function submit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (Object.values(problems).some(Boolean)) return;
    setSaving(true);
    setError(undefined);
    try {
      await onSave({ date, beltId, graduatedBy: examiners.map((examiner) => examiner.id) });
    } catch (failure) {
      setError(failure);
      setSaving(false);
    }
  }

  const errorId = (field) => shown[field] && `${ids.errors}-${field}`;
  const fieldError = (field) =>
    shown[field] && (
      <p id={errorId(field)} className="field-error">
        {shown[field]}
      </p>
    );

  return (
    <form aria-label={title} onSubmit={submit} noValidate>
      <h4>{title}</h4>
      <div>
        <label htmlFor={ids.date}>{t('members.graduation.date')}</label>
        <input
          id={ids.date}
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          aria-invalid={Boolean(shown.date) || undefined}
          aria-describedby={errorId('date') || undefined}
        />
        {fieldError('date')}
      </div>
      <div>
        <label htmlFor={ids.belt}>{t('members.graduation.belt')}</label>
        {belts.error ? (
          <ApiErrorMessage error={belts.error} />
        ) : (
          <select
            id={ids.belt}
            value={beltId}
            onChange={(event) => setBeltId(event.target.value)}
            disabled={belts.loading}
            aria-invalid={Boolean(shown.belt) || undefined}
            aria-describedby={errorId('belt') || undefined}
          >
            <option value="">{belts.loading ? t('app.loading') : t('members.graduation.chooseBelt')}</option>
            {sortBelts(belts.data ?? []).map((belt) => (
              <option key={belt.id} value={belt.id}>
                {beltName(belt)}
              </option>
            ))}
          </select>
        )}
        {fieldError('belt')}
      </div>
      <ExaminerPicker
        value={examiners}
        onChange={setExaminers}
        invalid={Boolean(shown.examiners)}
        describedBy={errorId('examiners') || undefined}
      />
      {fieldError('examiners')}
      <ApiErrorMessage error={error} />
      <button type="submit" disabled={saving}>
        {t('members.graduation.save')}
      </button>
      <button type="button" onClick={onCancel}>
        {t('members.graduation.cancel')}
      </button>
    </form>
  );
}
