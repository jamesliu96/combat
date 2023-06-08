const { u } = await Combat.fetchUser();
if (u.a) return;
const { g } = await Combat.fetchGame();

/**
 * @param {number} x
 * @param {number} y
 */
const get = (x, y) => {
  if (x < 0 || x > g.w - 1 || y < 0 || y > g.h - 1) return;
  return g.c[x + y * g.w];
};
const CT = get(Math.floor(g.w / 2), Math.floor(g.h / 2));
/**
 * @param {ICell} a
 * @param {ICell} b
 */
const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
/** @param {ICell} c */
const z = (c) =>
  (c.o === u.u
    ? (g.v *
        [
          get(c.x, c.y + 1),
          get(c.x + 1, c.y),
          get(c.x, c.y - 1),
          get(c.x - 1, c.y),
        ].filter((d) => d?.o && d.o !== u.u).length) /
      4
    : c.g
    ? g.s
    : c.e
    ? 1 / g.r
    : g.v) / c.t;
/**
 * @param {ICell} a
 * @param {ICell} b
 */
const COMP = (a, b) => z(b) - z(a) || (CT ? dist(CT, a) - dist(CT, b) : 0);
/**
 * @param {number} x
 * @param {number} y
 */
const attack = async (x, y) => {
  const { a } = await Combat.attack(x, y);
  Combat.log({ x, y }, Boolean(a));
};

if (u.o) {
  const s = new Set();
  for (const c of g.c.filter(({ o }) => o === u.u)) {
    const { x, y } = c;
    for (const j of [
      c,
      get(x, y + 1),
      get(x + 1, y),
      get(x, y - 1),
      get(x - 1, y),
    ])
      if (j && !j.a) s.add(j);
  }
  if (s.size) {
    const { x, y } = Array.from(s).sort(COMP)[0];
    attack(x, y);
  }
} else {
  const t = g.c.filter(({ a }) => !a).sort(COMP)[0];
  if (t) {
    const { x, y } = t;
    attack(x, y);
  }
}
