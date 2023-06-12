if (!('randomUUID' in crypto))
  Object.defineProperty(crypto, 'randomUUID', {
    value: () =>
      ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (
          c ^
          (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
      ),
  });

/** @type {Helpers} */
// deno-lint-ignore no-unused-vars
const Helpers = Object.freeze({
  Blast: Object.freeze({ Square: 1, Horizontal: 2, Vertical: 3 }),
  getCell: (g, x, y) => {
    if (x < 0 || x > g.w - 1 || y < 0 || y > g.h - 1) return;
    return g.c[x + y * g.w];
  },
  isCellOwnedBy: (c, u) => c.o === u.u,
  isCellAttackedBy: (c, u) => c.a === u.u,
  getAdjCells(g, c, u) {
    const { x, y } = c;
    return [
      this.getCell(g, x, y - 1),
      this.getCell(g, x + 1, y),
      this.getCell(g, x, y + 1),
      this.getCell(g, x - 1, y),
    ].filter((c) => c && (!u || this.isCellOwnedBy(c, u)));
  },
  getUserOwnedCells(g, u) {
    return g.c.filter((c) => this.isCellOwnedBy(c, u));
  },
  hasUserBase(g, u) {
    return g.c.some((c) => this.isCellOwnedBy(c, u));
  },
  isUserAttacking(g, u) {
    return g.c.some((c) => this.isCellAttackedBy(c, u));
  },
  getCellTime(g, c, u) {
    const t = c.o ? g.a + (g.z - g.a) * 2 ** (-(g.t - c.s) / g.m) : g.i;
    if (!u) return t;
    return (
      t *
      (1 - 0.25 * Math.max(0, this.getAdjCells(g, c, u).length - 1)) *
      g.r ** this.getUserEnergy(g, u)
    );
  },
  getUserEnergy(g, u) {
    return g.c.reduce(
      (acc, c) => acc + Number(this.isCellOwnedBy(c, u) && Boolean(c.e)),
      0
    );
  },
  getUserScore(g, u) {
    return this.getUserOwnedCells(g, u).reduce(
      (acc, c) => acc + (c.g ? g.s : g.v),
      0
    );
  },
  calcDist: (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2),
});
