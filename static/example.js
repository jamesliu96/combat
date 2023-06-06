const { u, g } = await Combat.fetchUserGame();
if (u.a) return;

/**
 * @param {IGame} g
 * @param {number} x
 * @param {number} y
 */
const getCell = (g, x, y) => {
  if (x < 0 || x > g.w - 1 || y < 0 || y > g.h - 1) return;
  return g.c[x + y * g.w];
};
const CT = getCell(g, Math.floor(g.w / 2), Math.floor(g.h / 2));
/**
 * @param {ICell} a
 * @param {ICell} b
 */
const calcDistance = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
/**
 * @param {ICell} a
 * @param {ICell} b
 */
const COMP = (a, b) =>
  a.t - b.t || (CT ? calcDistance(CT, a) - calcDistance(CT, b) : 0);

if (u.o) {
  const s = new Set();
  for (const c of g.c.filter(({ o }) => o === u.u)) {
    const { x, y } = c;
    for (const j of [
      c,
      getCell(g, x, y + 1),
      getCell(g, x + 1, y),
      getCell(g, x, y - 1),
      getCell(g, x - 1, y),
    ])
      if (j && !j.a) s.add(j);
  }
  if (s.size) {
    const { x, y } = Array.from([...s]).sort(COMP)[0];
    Combat.attack(x, y);
    Combat.log({ x, y });
  }
} else {
  const t = g.c.filter((c) => !c.a).sort(COMP)[0];
  if (t) {
    const { x, y } = t;
    Combat.attack(x, y);
    Combat.log({ x, y });
  }
}
