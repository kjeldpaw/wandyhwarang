import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { api, clubs, members } from '../test/memberService';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

// A Member's Role (member-service v1.5.0): only Admins see it and give it, never to themselves.

const created = {
  ...members.kim,
  id: '66666666-6666-6666-6666-666666666666',
  firstName: 'Lotte',
  lastName: 'Jensen',
  email: 'lotte@example.com',
  clubs: [clubs.randers],
};

// Records the body of each POST /members and answers like member-service.
function onCreate() {
  const requests = [];
  server.use(
    http.post(api('/members'), async ({ request }) => {
      const body = await request.json();
      requests.push(body);
      return HttpResponse.json({ ...created, role: body.role ?? 'member' }, { status: 201 });
    }),
    http.get(api(`/members/${created.id}`), () => HttpResponse.json(created)),
  );
  return requests;
}

async function fillRequired(user) {
  await user.type(screen.getByLabelText('Fornavn'), 'Lotte');
  await user.type(screen.getByLabelText('Efternavn'), 'Jensen');
  await user.type(screen.getByLabelText('Vej'), 'Havnegade 4');
  await user.type(screen.getByLabelText('Postnummer'), '8900');
  await user.type(screen.getByLabelText('By'), 'Randers');
  await user.type(screen.getByLabelText('E-mail'), 'lotte@example.com');
  await user.click(screen.getByRole('checkbox', { name: 'Randers Taekwondo Klub' }));
}

/**
 * Records every write on a Member's edit page: `updates` (PUT /members/:id) and `roleChanges`
 * (PUT /members/:id/role). `role` answers the Role change, e.g. with an error.
 */
function onEdit(member, { role = ({ body }) => HttpResponse.json({ ...member, role: body.role }) } = {}) {
  const writes = { updates: [], roleChanges: [] };
  server.use(
    http.put(api(`/members/${member.id}`), async ({ request }) => {
      writes.updates.push(await request.json());
      return HttpResponse.json(member);
    }),
    http.put(api(`/members/${member.id}/role`), async ({ request }) => {
      const body = await request.json();
      writes.roleChanges.push(body);
      return role({ body });
    }),
  );
  return writes;
}

const valueOf = (container, term) => within(container).getByText(term).nextElementSibling.textContent;
const roleChoices = () => within(screen.getByLabelText('Rolle')).getAllByRole('option').map((o) => o.textContent);

test('an Admin creates a Member as Instructor', async () => {
  const requests = onCreate();
  const { user } = renderApp('/members/new', { as: 'admin' });
  await screen.findByRole('checkbox', { name: 'Randers Taekwondo Klub' });

  expect(screen.getByLabelText('Rolle')).toHaveValue('member');
  expect(roleChoices()).toEqual(['Medlem', 'Instruktør', 'Admin']);
  await fillRequired(user);
  await user.selectOptions(screen.getByLabelText('Rolle'), 'Instruktør');
  await user.click(screen.getByRole('button', { name: 'Opret medlem' }));

  await screen.findByRole('heading', { level: 2, name: 'Lotte Jensen' });
  expect(requests).toEqual([expect.objectContaining({ role: 'instructor', clubIds: [clubs.randers.id] })]);
});

test('an Admin who leaves the Role alone creates a plain Member', async () => {
  const requests = onCreate();
  const { user } = renderApp('/members/new', { as: 'admin' });
  await screen.findByRole('checkbox', { name: 'Randers Taekwondo Klub' });

  await fillRequired(user);
  await user.click(screen.getByRole('button', { name: 'Opret medlem' }));

  await screen.findByRole('heading', { level: 2, name: 'Lotte Jensen' });
  expect(requests[0].role).toBe('member');
});

test('an Instructor gets no Role select on create and sends no Role', async () => {
  const requests = onCreate();
  const { user } = renderApp('/members/new', { as: 'instructor' });
  await screen.findByRole('checkbox', { name: 'Randers Taekwondo Klub' });

  expect(screen.queryByLabelText('Rolle')).not.toBeInTheDocument();
  await fillRequired(user);
  await user.click(screen.getByRole('button', { name: 'Opret medlem' }));

  await screen.findByRole('heading', { level: 2, name: 'Lotte Jensen' });
  expect(requests[0]).not.toHaveProperty('role');
});

test('an Instructor gets no Role select on edit and changes no Role', async () => {
  const writes = onEdit(members.mads);
  const { user } = renderApp(`/members/${members.mads.id}/edit`, { as: 'instructor' });

  await screen.findByLabelText('Vej');
  expect(screen.queryByLabelText('Rolle')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Gem' }));

  await screen.findByRole('heading', { level: 2, name: 'Mads Medlem' });
  expect(writes.updates).toHaveLength(1);
  expect(writes.updates[0]).not.toHaveProperty('role');
  expect(writes.roleChanges).toEqual([]);
});

test("an Admin changes a Member's Role along with their details", async () => {
  const writes = onEdit(members.mads);
  const { user } = renderApp(`/members/${members.mads.id}/edit`, { as: 'admin' });

  expect(await screen.findByLabelText('Rolle')).toHaveValue('member');
  await user.clear(screen.getByLabelText('Vej'));
  await user.type(screen.getByLabelText('Vej'), 'Lillegade 7');
  await user.selectOptions(screen.getByLabelText('Rolle'), 'Admin');
  await user.click(screen.getByRole('button', { name: 'Gem' }));

  await screen.findByRole('heading', { level: 2, name: 'Mads Medlem' });
  expect(writes.updates).toEqual([expect.objectContaining({ address: expect.objectContaining({ street: 'Lillegade 7' }) })]);
  expect(writes.updates[0]).not.toHaveProperty('role');
  expect(writes.roleChanges).toEqual([{ role: 'admin' }]);
});

test('an Admin who saves without changing the Role changes no Role', async () => {
  const writes = onEdit(members.ida);
  const { user } = renderApp(`/members/${members.ida.id}/edit`, { as: 'admin' });

  expect(await screen.findByLabelText('Rolle')).toHaveValue('instructor');
  await user.click(screen.getByRole('button', { name: 'Gem' }));

  await screen.findByRole('heading', { level: 2, name: 'Ida Instruktør' });
  expect(writes.updates).toHaveLength(1);
  expect(writes.roleChanges).toEqual([]);
});

test('a failed Role change shows the error and keeps the form', async () => {
  const writes = onEdit(members.mads, { role: () => new HttpResponse(null, { status: 403 }) });
  const { user } = renderApp(`/members/${members.mads.id}/edit`, { as: 'admin' });

  await user.selectOptions(await screen.findByLabelText('Rolle'), 'Instruktør');
  await user.click(screen.getByRole('button', { name: 'Gem' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Du har ikke adgang til dette.');
  expect(screen.getByRole('heading', { level: 2, name: 'Rediger Mads Medlem' })).toBeInTheDocument();
  expect(screen.getByLabelText('Rolle')).toHaveValue('instructor');
  expect(writes.roleChanges).toEqual([{ role: 'instructor' }]);
});

test('a failed update of the details changes no Role', async () => {
  const writes = onEdit(members.mads);
  server.use(http.put(api(`/members/${members.mads.id}`), () => new HttpResponse(null, { status: 500 })));
  const { user } = renderApp(`/members/${members.mads.id}/edit`, { as: 'admin' });

  await user.selectOptions(await screen.findByLabelText('Rolle'), 'Instruktør');
  await user.click(screen.getByRole('button', { name: 'Gem' }));

  expect(await screen.findByRole('alert')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: 'Rediger Mads Medlem' })).toBeInTheDocument();
  expect(writes.roleChanges).toEqual([]);
});

test('an Admin editing their own record cannot change their Role', async () => {
  const writes = onEdit(members.anne);
  const { user } = renderApp(`/members/${members.anne.id}/edit`, { as: 'admin' });

  const select = await screen.findByLabelText('Rolle');
  expect(select).toHaveValue('admin');
  expect(select).toBeDisabled();
  expect(select).toHaveAccessibleDescription('En anden Admin skal ændre din rolle.');
  await user.click(screen.getByRole('button', { name: 'Gem' }));

  await screen.findByRole('heading', { level: 2, name: 'Anne Admin' });
  expect(writes.roleChanges).toEqual([]);
});

test('an Admin gets no Role select for a Member member-service sends no Role for', async () => {
  server.use(http.get(api(`/members/${members.kim.id}`), () => HttpResponse.json(members.kim)));
  renderApp(`/members/${members.kim.id}/edit`, { as: 'admin' });

  await screen.findByLabelText('Vej');
  expect(screen.queryByLabelText('Rolle')).not.toBeInTheDocument();
});

test("the Member detail shows an Admin the Member's Role", async () => {
  renderApp(`/members/${members.ida.id}`, { as: 'admin' });

  const personal = await screen.findByRole('region', { name: 'Personlige oplysninger' });
  expect(valueOf(personal, 'Rolle')).toBe('Instruktør');
});

test("the Member detail shows an Instructor no Role", async () => {
  renderApp(`/members/${members.mads.id}`, { as: 'instructor' });

  const personal = await screen.findByRole('region', { name: 'Personlige oplysninger' });
  expect(within(personal).queryByText('Rolle')).not.toBeInTheDocument();
});

test('the Role stays on the detail after a write that answers without it', async () => {
  server.use(
    http.put(api(`/members/${members.mads.id}/clubs/${clubs.aarhus.id}`), () =>
      HttpResponse.json({ ...members.mads, clubs: [...members.mads.clubs, clubs.aarhus] }),
    ),
  );
  const { user } = renderApp(`/members/${members.mads.id}`, { as: 'admin' });

  const clubsRegion = await screen.findByRole('region', { name: 'Klubber' });
  await user.selectOptions(within(clubsRegion).getByRole('combobox'), clubs.aarhus.name);
  await user.click(within(clubsRegion).getByRole('button', { name: 'Tilføj' }));

  await within(clubsRegion).findByText(clubs.aarhus.name);
  expect(valueOf(screen.getByRole('region', { name: 'Personlige oplysninger' }), 'Rolle')).toBe('Medlem');
});
