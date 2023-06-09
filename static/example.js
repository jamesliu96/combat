const { u } = await Game.fetchUser();
const { g } = await Game.fetchGame();

if (Helpers.isUserAttacking(g, u)) return;

const CT = Helpers.getCell(g, Math.floor(g.w / 2), Math.floor(g.h / 2));

/** @param {ICell} c */
const z = (c) =>
  (c.o === u.u
    ? (g.v * Helpers.getAdjCells(g, c, u).length) / 4
    : c.g
    ? g.s
    : c.e
    ? 1 / g.r
    : g.v) / Helpers.getCellTime(g, c, u);
/**
 * @param {ICell} a
 * @param {ICell} b
 */
const COMP = (a, b) =>
  z(b) - z(a) || (CT ? Helpers.calcDist(CT, a) - Helpers.calcDist(CT, b) : 0);
/**
 * @param {number} x
 * @param {number} y
 */
const attack = async (x, y) => {
  const { a } = await Game.attack(x, y);
  await Game.log({ x, y }, Boolean(a));
};

if (Helpers.hasUserBase(g, u)) {
  const s = new Set();
  for (const c of Helpers.getUserOwnedCells(g, u))
    for (const j of [c, ...Helpers.getAdjCells(g, c)]) if (!j.a) s.add(j);
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
