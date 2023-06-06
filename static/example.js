const { u } = await Combat.fetchUser();
if (u.a) return;
const { g } = await Combat.fetchGame();

/**
 * @param {IGame} g
 * @param {number} x
 * @param {number} y
 */
const GET = (x, y) => {
  if (x < 0 || x > g.w - 1 || y < 0 || y > g.h - 1) return;
  return g.c[x + y * g.w];
};
const CT = GET(Math.floor(g.w / 2), Math.floor(g.h / 2));
/**
 * @param {ICell} a
 * @param {ICell} b
 */
const DIST = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
/** @param {ICell} c */
const Z = (c) => (c.o === u.u ? g.v / 4 : c.g ? g.s : g.v) / c.t;
/**
 * @param {ICell} a
 * @param {ICell} b
 */
const COMP = (a, b) => Z(b) - Z(a) || (CT ? DIST(CT, a) - DIST(CT, b) : 0);

if (u.o) {
  const s = new Set();
  for (const c of g.c.filter(({ o }) => o === u.u)) {
    const { x, y } = c;
    for (const j of [
      c,
      GET(x, y + 1),
      GET(x + 1, y),
      GET(x, y - 1),
      GET(x - 1, y),
    ])
      if (j && !j.a) s.add(j);
  }
  if (s.size) {
    const { x, y } = Array.from(s).sort(COMP)[0];
    Combat.attack(x, y);
    Combat.log({ x, y });
  }
} else {
  const t = g.c.filter(({ a }) => !a).sort(COMP)[0];
  if (t) {
    const { x, y } = t;
    Combat.attack(x, y);
    Combat.log({ x, y });
  }
}
