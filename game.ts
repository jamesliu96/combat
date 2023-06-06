import { Cell } from './cell.ts';
import { User } from './user.ts';

export class Game {
  users = new Set<User>();

  now = Date.now();

  cells;

  constructor(
    readonly width: number,
    readonly height: number,
    readonly goldCount = 0,
    readonly energyCount = 0,
    readonly worth = 1,
    readonly goldWorth = 10,
    readonly energyRatio = 0.99,
    readonly idle = 2000,
    readonly min = 3000,
    readonly max = 30000,
    readonly conv = 30000
  ) {
    this.width = Math.max(0, this.width);
    this.height = Math.max(0, this.height);
    const N = this.width * this.height;
    this.goldCount = Math.max(0, Math.min(N, this.goldCount));
    const golds = new Set<number>();
    while (golds.size < this.goldCount)
      golds.add(Math.floor(Math.random() * N));
    this.energyCount = Math.max(
      0,
      Math.min(N - this.goldCount, this.energyCount)
    );
    const energies = new Set<number>();
    while (energies.size < this.energyCount) {
      const idx = Math.floor(Math.random() * N);
      if (!golds.has(idx)) energies.add(idx);
    }
    this.worth = Math.max(1, this.worth);
    this.goldWorth = Math.max(1, this.goldWorth);
    this.energyRatio = Math.max(
      Number.MIN_VALUE,
      Math.min(1, this.energyRatio)
    );
    this.idle = Math.max(0, this.idle);
    this.min = Math.max(0, this.min);
    this.max = Math.max(this.min, this.max);
    this.cells = Array.from(Array(N), (_, idx) => {
      const { x, y } = this.#getCoords(idx);
      return new Cell(this, x, y, golds.has(idx), energies.has(idx));
    });
  }
  #getCoords(idx: number) {
    return {
      x: idx % this.width,
      y: Math.floor(idx / this.width),
    };
  }

  getCell(x: number, y: number) {
    if (x < 0 || x > this.width - 1 || y < 0 || y > this.height - 1) return;
    return this.cells[x + y * this.width];
  }

  #update() {
    this.now = Date.now();
    for (const cell of this.cells) cell.update();
  }

  attack(x: number, y: number, user: User) {
    this.#update();
    return this.getCell(x, y)?.attack(user) ?? false;
  }

  toJSON(user?: User): IGame {
    this.#update();
    return {
      w: this.width,
      h: this.height,
      g: this.goldCount,
      e: this.energyCount,
      v: this.worth,
      s: this.goldWorth,
      r: this.energyRatio,
      i: this.idle,
      a: this.min,
      z: this.max,
      c: this.cells.map((x) => x.toJSON(user)),
      u: Array.from(this.users).map((x) => x.toJSON()),
      t: this.now,
    };
  }
}
