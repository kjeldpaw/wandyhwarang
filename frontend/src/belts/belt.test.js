import { beltColours } from './belt';

const belt = (name) => ({ name });

describe('beltColours', () => {
  it.each([
    ['White Belt with yellow snippet (10. KUP)', 'white', ['yellow']],
    ['Yellow Belt (9. KUP)', 'yellow', []],
    ['Orange Belt (8. KUP)', 'orange', []],
    ['Green Belt (7. KUP)', 'green', []],
    ['Blue Belt (6. KUP)', 'blue', []],
    ['Blue Belt with red snippet (5. KUP)', 'blue', ['red']],
    ['Red Belt (4. KUP)', 'red', []],
    ['Red Belt with black snippet (3. KUP)', 'red', ['black']],
    ['Red Belt with two black snippets (2. KUP)', 'red', ['black', 'black']],
    ['Red Belt with three black snippets (1. KUP)', 'red', ['black', 'black', 'black']],
    ['Black Belt (1. DAN)', 'black', []],
    ['Black Belt (9. DAN)', 'black', []],
  ])('%s is %s with stripes %j', (name, base, stripes) => {
    expect(beltColours(belt(name))).toEqual({ base, stripes });
  });

  it('gives a Mon grade the colours of the Kup with the same number', () => {
    expect(beltColours(belt('Blue Belt with red snippet (5. MON)'))).toEqual({ base: 'blue', stripes: ['red'] });
    expect(beltColours(belt('Red Belt with two black snippets (2. MON)'))).toEqual({
      base: 'red',
      stripes: ['black', 'black'],
    });
  });

  it('goes by the grade number, not the colour words in the name', () => {
    expect(beltColours(belt('Grønt bælte (7. KUP)'))).toEqual({ base: 'green', stripes: [] });
  });

  it('has no colours for a name without a known grade', () => {
    expect(beltColours(belt('Honorary Belt'))).toBeNull();
    expect(beltColours(belt('Mystery Belt (11. KUP)'))).toBeNull();
    expect(beltColours(undefined)).toBeNull();
  });
});
