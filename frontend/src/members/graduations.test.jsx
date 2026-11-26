import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { api, belts, graduations, members } from '../test/memberService';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

// Recording a Member's Graduations from the detail page (wandyhwarang#10).

const section = () => screen.getByRole('region', { name: 'Bælte og gradueringer' });

function historyRows() {
  const table = within(section()).getByRole('table', { name: 'Gradueringer' });
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell').slice(0, 3).map((cell) => cell.textContent));
}

async function openDetail(member, as = 'instructor') {
  const rendered = renderApp(`/members/${member.id}`, { as });
  await screen.findByRole('heading', { level: 2, name: `${member.firstName} ${member.lastName}` });
  return rendered;
}

// Types into the Examiner search and picks the result with that name.
async function pickExaminer(user, form, text, name) {
  await user.type(within(form).getByLabelText('Søg eksaminator'), text);
  const results = await within(form).findByRole('list', { name: 'Søgeresultater' });
  await user.click(await within(results).findByRole('button', { name }));
}

test('an Instructor records a Graduation with an Examiner from another Club', async () => {
  const kim = members.kim;
  let body;
  server.use(
    http.post(api(`/members/${kim.id}/graduation`), async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(
        { ...kim, graduation: graduations({ date: body.date, belt: belts.kup10, graduatedBy: [members.ole] }) },
        { status: 201 },
      );
    }),
  );
  const { user } = await openDetail(kim);

  await user.click(within(section()).getByRole('button', { name: 'Tilføj graduering' }));
  const form = await screen.findByRole('form', { name: 'Ny graduering' });
  await user.type(within(form).getByLabelText('Dato'), '2024-06-01');
  await user.selectOptions(await within(form).findByLabelText('Bælte'), '10. Kup');
  // Ole is in Nordjysk, a Club Ida (the Instructor) isn't in.
  await pickExaminer(user, form, 'ole', 'Ole Hansen');
  await user.click(within(form).getByRole('button', { name: 'Gem' }));

  expect(await within(section()).findByText('Nuværende bælte: 10. Kup')).toBeInTheDocument();
  expect(body).toEqual({ date: '2024-06-01', beltId: belts.kup10.id, graduatedBy: [members.ole.id] });
  expect(historyRows()).toEqual([['1. juni 2024', '10. Kup', 'Ole Hansen']]);
  expect(screen.queryByRole('form', { name: 'Ny graduering' })).not.toBeInTheDocument();
});

test('a date and at least one Examiner are required before anything is sent', async () => {
  let sent = false;
  server.use(
    http.post(api(`/members/${members.kim.id}/graduation`), () => {
      sent = true;
      return HttpResponse.json(members.kim, { status: 201 });
    }),
  );
  const { user } = await openDetail(members.kim);

  await user.click(within(section()).getByRole('button', { name: 'Tilføj graduering' }));
  const form = await screen.findByRole('form', { name: 'Ny graduering' });
  await user.click(within(form).getByRole('button', { name: 'Gem' }));

  expect(within(form).getByText('Vælg en dato.')).toBeInTheDocument();
  expect(within(form).getByText('Vælg et bælte.')).toBeInTheDocument();
  expect(within(form).getByText('Vælg mindst én eksaminator.')).toBeInTheDocument();
  expect(within(form).getByLabelText('Dato')).toHaveAttribute('aria-invalid', 'true');
  expect(sent).toBe(false);

  // Fixing one problem clears its message only.
  await user.type(within(form).getByLabelText('Dato'), '2024-06-01');
  expect(within(form).queryByText('Vælg en dato.')).not.toBeInTheDocument();
  expect(within(form).getByText('Vælg mindst én eksaminator.')).toBeInTheDocument();
});

test('validation messages follow the chosen language', async () => {
  const { user } = await openDetail(members.kim);
  await user.selectOptions(screen.getByLabelText('Sprog'), 'English');

  await user.click(screen.getByRole('button', { name: 'Add Graduation' }));
  const form = await screen.findByRole('form', { name: 'New Graduation' });
  await user.click(within(form).getByRole('button', { name: 'Save' }));

  expect(within(form).getByText('Choose a date.')).toBeInTheDocument();
  expect(within(form).getByText('Choose at least one Examiner.')).toBeInTheDocument();
});

test('every Belt member-service has is offered in rank order', async () => {
  const { user } = await openDetail(members.kim);

  await user.click(within(section()).getByRole('button', { name: 'Tilføj graduering' }));
  const form = await screen.findByRole('form', { name: 'Ny graduering' });
  const select = await within(form).findByLabelText('Bælte');
  await within(select).findByRole('option', { name: '9. Mon' });

  expect(within(select).getAllByRole('option').map((option) => option.textContent)).toEqual([
    'Vælg bælte',
    ...['9. Mon', '8. Mon', '7. Mon', '6. Mon', '5. Mon', '4. Mon', '3. Mon', '2. Mon', '1. Mon'],
    ...['10. Kup', '9. Kup', '8. Kup', '7. Kup', '6. Kup', '5. Kup', '4. Kup', '3. Kup', '2. Kup', '1. Kup'],
    ...['1. Dan', '2. Dan', '3. Dan'],
  ]);
});

test('the Examiner picker shows only names, waits for 2 letters and allows several Examiners', async () => {
  const searches = [];
  const recordSearch = ({ request }) => {
    if (request.url.includes('/examiners')) searches.push(new URL(request.url).searchParams.get('q'));
  };
  server.events.on('request:start', recordSearch);
  onTestFinished(() => server.events.removeListener('request:start', recordSearch));
  let body;
  server.use(
    http.post(api(`/members/${members.kim.id}/graduation`), async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(members.kim, { status: 201 });
    }),
  );
  const { user } = await openDetail(members.kim);
  await user.click(within(section()).getByRole('button', { name: 'Tilføj graduering' }));
  const form = await screen.findByRole('form', { name: 'Ny graduering' });

  await user.type(within(form).getByLabelText('Søg eksaminator'), 'a');
  expect(within(form).getByText('Skriv mindst 2 bogstaver.')).toBeInTheDocument();
  await user.type(within(form).getByLabelText('Søg eksaminator'), 'n');
  const results = await within(form).findByRole('list', { name: 'Søgeresultater' });
  // "an" matches Anne Admin and Ole Hansen: names only, no Club, email or address.
  expect(within(results).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
    'Anne Admin',
    'Ole Hansen',
  ]);
  expect(searches).toContain('an');
  expect(searches.every((q) => q.trim().length >= 2)).toBe(true);

  await user.click(within(results).getByRole('button', { name: 'Ole Hansen' }));
  await pickExaminer(user, form, 'ida', 'Ida Instruktør');
  const chosen = within(form).getByRole('list', { name: 'Valgte eksaminatorer' });
  expect(within(chosen).getAllByRole('listitem').map((item) => item.firstChild.textContent)).toEqual([
    'Ole Hansen',
    'Ida Instruktør',
  ]);

  await pickExaminer(user, form, 'anne', 'Anne Admin');
  await user.click(within(form).getByRole('button', { name: 'Fjern Anne Admin' }));

  await user.type(within(form).getByLabelText('Dato'), '2024-06-01');
  await user.selectOptions(within(form).getByLabelText('Bælte'), '10. Kup');
  await user.click(within(form).getByRole('button', { name: 'Gem' }));

  await waitForFormToClose('Ny graduering');
  expect(body.graduatedBy).toEqual([members.ole.id, members.ida.id]);
});

async function waitForFormToClose(name) {
  await waitFor(() => expect(screen.queryByRole('form', { name })).not.toBeInTheDocument());
}
