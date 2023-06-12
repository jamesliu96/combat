import { Game } from './game.ts';
import { User } from './user.ts';

export const enum Blast {
  Square = 1,
  Horizontal = 2,
  Vertical = 3,
}

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
    readonly energy: boolean,
    readonly blast: boolean
  ) {}

  #adj(user: User) {
    const { x, y } = this;
    return (
      [
        this.game.cell(x, y - 1),
        this.game.cell(x + 1, y),
        this.game.cell(x, y + 1),
        this.game.cell(x - 1, y),
      ].filter((c) => c && user.is(c.#owner)) as Cell[]
    ).length;
  }

  #time(user: User) {
    return this.#owner
      ? this.game.min +
          (this.game.max - this.game.min) *
            2 ** (-(this.game.now - this.#ownedAt) / this.game.conv)
      : this.game.idle *
          (1 - 0.25 * Math.max(0, this.#adj(user) - 1)) *
          this.game.energyRatio ** user.energy;
  }

  #blast(x: number, y: number, blast?: Blast) {
    switch (blast) {
      case Blast.Square:
        return [
          this.game.cell(x - 2, y),
          this.game.cell(x - 1, y),
          this.game.cell(x + 1, y),
          this.game.cell(x + 2, y),
          this.game.cell(x, y - 2),
          this.game.cell(x, y - 1),
          this.game.cell(x, y + 1),
          this.game.cell(x, y + 2),
        ];
      case Blast.Horizontal:
        return [
          this.game.cell(x - 4, y),
          this.game.cell(x - 3, y),
          this.game.cell(x - 2, y),
          this.game.cell(x - 1, y),
          this.game.cell(x + 1, y),
          this.game.cell(x + 2, y),
          this.game.cell(x + 3, y),
          this.game.cell(x + 4, y),
        ];
      case Blast.Vertical:
        return [
          this.game.cell(x, y - 4),
          this.game.cell(x, y - 3),
          this.game.cell(x, y - 2),
          this.game.cell(x, y - 1),
          this.game.cell(x, y + 1),
          this.game.cell(x, y + 2),
          this.game.cell(x, y + 3),
          this.game.cell(x, y + 4),
        ];
    }
    return [];
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

  attack(user: User, blast?: Blast) {
    if (user.attacking || this.#attacker) return;
    if (blast && this.blast) {
      if (user.is(this.#owner)) {
        const { x, y } = this;
        for (const neighbor of this.#blast(x, y, blast).filter(
          (c) => c && !c.#attacker
        ) as Cell[])
          neighbor.#attack(user);
      }
      return;
    }
    if (!user.based || user.is(this.#owner) || this.#adj(user))
      this.#attack(user);
  }
  #attack(user: User) {
    this.#attacker = user;
    this.#attackedAt = this.game.now;
    this.#takenAt = this.#attackedAt + this.#time(user);
  }

  toJSON(): ICell {
    return {
      x: this.x,
      y: this.y,
      g: Number(this.gold) as 0 | 1,
      e: Number(this.energy) as 0 | 1,
      b: Number(this.blast) as 0 | 1,
      o: this.#owner?.uuid ?? '',
      a: this.#attacker?.uuid ?? '',
      s: this.#ownedAt,
      d: this.#attackedAt,
      f: this.#takenAt,
    };
  }
}
