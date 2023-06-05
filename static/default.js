const { u, g } = await Game.fetchUserGame();
if (u.a) return;
const CT = Game.getCell(g, Math.floor(g.w / 2), Math.floor(g.h / 2));
const COMP = (a, b) =>
  a.t - b.t || Game.calcDistance(CT, a) - Game.calcDistance(CT, b);
if (!u.o) {
  const t = g.c.filter((c) => !c.a).sort(COMP)[0];
  if (t) {
    const { x, y } = t;
    Game.attack(x, y);
    log(x, y);
  }
  return;
}
const s = new Set();
for (const c of g.c.filter(({ o }) => o === u.u)) {
  const { x, y } = c;
  for (const j of [
    c,
    Game.getCell(g, x, y + 1),
    Game.getCell(g, x + 1, y),
    Game.getCell(g, x, y - 1),
    Game.getCell(g, x - 1, y),
  ])
    if (j && !j.a) s.add(j);
}
if (s.size) {
  const { x, y } = [...s].sort(COMP)[0];
  Game.attack(x, y);
  log(x, y);
}
