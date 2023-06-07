import { Game } from './game.ts';
import { User } from './user.ts';

export class Cell {
  #owner?: User;
  get owner() {
    return this.#owner;
  }
  #attacker?: User;
  get attacker() {
    return this.#attacker;
  }

  #ownedAt = 0;
  #attackedAt = 0;
  #takenAt = 0;

  constructor(
    readonly game: Game,
    readonly x: number,
    readonly y: number,
    readonly gold: boolean,
    readonly energy: boolean
  ) {}

  #adj(user: User) {
    const { x, y } = this;
    return [
      this.game.getCell(x, y + 1),
      this.game.getCell(x + 1, y),
      this.game.getCell(x, y - 1),
      this.game.getCell(x - 1, y),
    ].filter((c) => c && user.is(c.#owner)).length;
  }

  #getTakeTime(user?: User) {
    const base = this.#owner
      ? this.game.min +
        (this.game.max - this.game.min) *
          2 ** (-(this.game.now - this.#ownedAt) / this.game.conv)
      : this.game.idle;
    if (!user) return base;
    return (
      base *
      (1 - 0.25 * Math.max(0, this.#adj(user) - 1)) *
      this.game.energyRatio ** user.energy
    );
  }

  update() {
    if (this.#attacker && this.game.now > this.#takenAt) {
      this.#owner = this.#attacker;
      this.#attacker = undefined;
      this.#ownedAt = this.#takenAt;
      this.#attackedAt = 0;
      this.#takenAt = 0;
    }
  }

  attack(user: User) {
    if (user.attacking.length || this.attacker) return false;
    if (!user.occupied.length || user.is(this.owner) || this.#adj(user))
      return this.#attack(user);
    return false;
  }
  #attack(user: User) {
    this.#attacker = user;
    this.#attackedAt = this.game.now;
    this.#takenAt = this.#attackedAt + this.#getTakeTime(user);
    return true;
  }

  toJSON(user?: User): ICell {
    return {
      x: this.x,
      y: this.y,
      g: Number(this.gold) as 0 | 1,
      e: Number(this.energy) as 0 | 1,
      o: this.#owner?.uuid ?? '',
      a: this.#attacker?.uuid ?? '',
      c: this.#ownedAt,
      b: this.#attackedAt,
      u: this.#takenAt,
      t: this.#getTakeTime(user),
    };
  }
}
