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
    readonly goldWorth = 10,
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
    this.goldWorth = Math.max(1, this.goldWorth);
    this.idle = Math.max(0, this.idle);
    this.min = Math.max(0, this.min);
    this.max = Math.max(this.min, this.max);
    this.cells = Array.from(Array(N), (_, idx) => {
      const { x, y } = this.#getCoords(idx);
      return new Cell(this, x, y, golds.has(idx));
    });
  }
  #getCoords(idx: number) {
    return {
      x: idx % this.width,
      y: Math.floor(idx / this.width),
    };
  }

  #update() {
    this.now = Date.now();
    for (const cell of this.cells) cell.update();
  }

  attack(x: number, y: number, user: User) {
    this.#update();
    return this.#attack(x, y, user);
  }
  #attack(x: number, y: number, user: User) {
    const cell = this.#getCell(x, y);
    if (cell && !cell.attacker && !user.attacking) {
      if (user.base) {
        for (const c of [
          cell,
          this.#getCell(x, y + 1),
          this.#getCell(x + 1, y),
          this.#getCell(x, y - 1),
          this.#getCell(x - 1, y),
        ])
          if (user.is(c?.owner)) {
            cell.attack(user);
            return true;
          }
      } else {
        cell.attack(user);
        return true;
      }
    }
    return false;
  }
  #getCell(x: number, y: number) {
    if (x < 0 || x > this.width - 1 || y < 0 || y > this.height - 1) return;
    return this.cells[x + y * this.width];
  }

  toJSON(): IGame {
    this.#update();
    return {
      w: this.width,
      h: this.height,
      g: this.goldCount,
      s: this.goldWorth,
      i: this.idle,
      a: this.min,
      z: this.max,
      c: this.cells.map((x) => x.toJSON()),
      u: Array.from(this.users).map((x) => x.toJSON()),
      t: this.now,
    };
  }
}
