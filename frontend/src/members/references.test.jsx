import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { api, members } from '../test/memberService';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

const references = () => screen.getByRole('region', { name: 'Referencer' });

// The value next to a term in the References list.
const valueOf = (term) => within(references()).getByText(term).nextElementSibling.textContent;

async function openMember(member, as = 'instructor') {
  const rendered = renderApp(`/members/${member.id}`, { as });
  await screen.findByRole('heading', { level: 2, name: `${member.firstName} ${member.lastName}` });
  return rendered;
}

test('an Instructor adds a Kukkiwon Reference to a Member', async () => {
  const kim = members.kim;
  let body;
  server.use(
    http.post(api(`/members/${kim.id}/reference`), async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(
        { ...kim, references: [{ id: 'reference-new', type: 'KukkiWon', reference: '05987654' }] },
        { status: 201 },
      );
    }),
  );
  const { user } = await openMember(kim);

  await user.click(within(references()).getByRole('button', { name: 'Tilføj reference' }));
  await user.selectOptions(within(references()).getByLabelText('Type'), 'Kukkiwon');
  await user.type(within(references()).getByLabelText('Nummer'), ' 05987654 ');
  await user.click(within(references()).getByRole('button', { name: 'Gem' }));

  expect(await within(references()).findByText('05987654')).toBeInTheDocument();
  expect(body).toEqual({ type: 'KukkiWon', reference: '05987654' });
  expect(valueOf('Kukkiwon')).toBe('05987654');
  expect(within(references()).queryByLabelText('Nummer')).not.toBeInTheDocument();
});

test('a Reference needs a number before it is sent', async () => {
  const kim = members.kim;
  let posted = false;
  server.use(
    http.post(api(`/members/${kim.id}/reference`), () => {
      posted = true;
      return HttpResponse.json(kim, { status: 201 });
    }),
  );
  const { user } = await openMember(kim);

  await user.click(within(references()).getByRole('button', { name: 'Tilføj reference' }));
  expect(within(references()).getByLabelText('Type')).toHaveDisplayValue('Wandy Wha Rang');
  await user.type(within(references()).getByLabelText('Nummer'), '   ');
  await user.click(within(references()).getByRole('button', { name: 'Gem' }));

  expect(within(references()).getByText('Udfyld nummeret.')).toBeInTheDocument();
  expect(posted).toBe(false);
});

test('adding a Reference can be cancelled', async () => {
  const { user } = await openMember(members.kim);

  await user.click(within(references()).getByRole('button', { name: 'Tilføj reference' }));
  await user.click(within(references()).getByRole('button', { name: 'Annuller' }));

  expect(within(references()).queryByLabelText('Nummer')).not.toBeInTheDocument();
  expect(within(references()).getByText('Ingen referencer.')).toBeInTheDocument();
});

test('an Instructor edits the number of a Reference', async () => {
  const mads = members.mads;
  let body;
  server.use(
    http.put(api(`/members/${mads.id}/reference/reference-wwr`), async ({ request }) => {
      body = await request.json();
      return HttpResponse.json({
        ...mads,
        references: mads.references.map((r) => (r.id === 'reference-wwr' ? { ...r, reference: 'DK-5678' } : r)),
      });
    }),
  );
  const { user } = await openMember(mads);

  await user.click(within(references()).getByRole('button', { name: 'Rediger Wandy Wha Rang' }));
  const number = within(references()).getByLabelText('Nummer');
  expect(number).toHaveValue('DK-1234');
  await user.clear(number);
  await user.type(number, 'DK-5678');
  await user.click(within(references()).getByRole('button', { name: 'Gem' }));

  expect(await within(references()).findByText('DK-5678')).toBeInTheDocument();
  expect(body).toEqual({ reference: 'DK-5678' });
  expect(valueOf('Kukkiwon')).toBe('05123456');
});

test('an Instructor removes a Reference after confirming', async () => {
  const mads = members.mads;
  let removed = 0;
  server.use(
    http.delete(api(`/members/${mads.id}/reference/reference-kukkiwon`), () => {
      removed += 1;
      return HttpResponse.json({ ...mads, references: mads.references.filter((r) => r.type !== 'KukkiWon') });
    }),
  );
  const { user } = await openMember(mads);

  await user.click(within(references()).getByRole('button', { name: 'Fjern Kukkiwon' }));
  expect(within(references()).getByText('Fjern Kukkiwon-referencen 05123456?')).toBeInTheDocument();
  await user.click(within(references()).getByRole('button', { name: 'Annuller' }));
  expect(removed).toBe(0);

  await user.click(within(references()).getByRole('button', { name: 'Fjern Kukkiwon' }));
  await user.click(within(references()).getByRole('button', { name: 'Ja, fjern' }));

  await within(references()).findByRole('button', { name: 'Fjern Wandy Wha Rang' });
  expect(within(references()).queryByText('05123456')).not.toBeInTheDocument();
  expect(valueOf('Wandy Wha Rang')).toBe('DK-1234');
  expect(removed).toBe(1);
});

test('a failed Reference change shows a translated error and keeps the form', async () => {
  const mads = members.mads;
  server.use(
    http.put(api(`/members/${mads.id}/reference/reference-wwr`), () => new HttpResponse(null, { status: 403 })),
  );
  const { user } = await openMember(mads);

  await user.click(within(references()).getByRole('button', { name: 'Rediger Wandy Wha Rang' }));
  await user.type(within(references()).getByLabelText('Nummer'), '9');
  await user.click(within(references()).getByRole('button', { name: 'Gem' }));

  expect(await within(references()).findByRole('alert')).toHaveTextContent('Du har ikke adgang til dette.');
  expect(within(references()).getByLabelText('Nummer')).toHaveValue('DK-12349');
});

test('an Admin can manage References too', async () => {
  await openMember(members.mads, 'admin');

  expect(within(references()).getByRole('button', { name: 'Tilføj reference' })).toBeInTheDocument();
  expect(within(references()).getByRole('button', { name: 'Rediger Kukkiwon' })).toBeInTheDocument();
});

test('a plain Member sees their References read-only', async () => {
  await openMember(members.mads, 'member');

  expect(valueOf('Wandy Wha Rang')).toBe('DK-1234');
  expect(valueOf('Kukkiwon')).toBe('05123456');
  expect(within(references()).queryAllByRole('button')).toEqual([]);
});
