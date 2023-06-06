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
    readonly gold: boolean
  ) {}

  #getAdjacent(user: User) {
    const { x, y } = this;
    return [
      this.game.getCell(x, y + 1),
      this.game.getCell(x + 1, y),
      this.game.getCell(x, y - 1),
      this.game.getCell(x - 1, y),
    ].filter((c) => user.is(c?.owner)).length;
  }

  get baseTakeTime() {
    return this.#owner
      ? this.game.min +
          (this.game.max - this.game.min) *
            2 ** (-(this.game.now - this.#ownedAt) / this.game.conv)
      : this.game.idle;
  }

  getTakeTime(user?: User) {
    if (!user) return this.baseTakeTime;
    return (
      this.baseTakeTime * (1 - 0.25 * Math.max(0, this.#getAdjacent(user) - 1))
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
    if (!user.occupied.length) return this.#attack(user);
    if (user.is(this.owner) || this.#getAdjacent(user))
      return this.#attack(user);
    return false;
  }
  #attack(user: User) {
    const t = this.getTakeTime(user);
    if (t) {
      this.#attacker = user;
      this.#attackedAt = this.game.now;
      this.#takenAt = this.#attackedAt + t;
    } else {
      this.#owner = user;
      this.#ownedAt = this.game.now;
    }
    return true;
  }

  toJSON(user?: User): ICell {
    return {
      x: this.x,
      y: this.y,
      g: Number(this.gold) as 0 | 1,
      o: this.#owner?.uuid ?? '',
      a: this.#attacker?.uuid ?? '',
      c: this.#ownedAt,
      b: this.#attackedAt,
      u: this.#takenAt,
      p: this.baseTakeTime,
      t: this.getTakeTime(user),
    };
  }
}
