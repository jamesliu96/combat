import { Game } from './game.ts';

export class User {
  readonly uuid: string;

  constructor(
    readonly game: Game,
    public name = '',
    public hue = Math.floor(Math.random() * 360)
  ) {
    this.uuid = crypto.randomUUID();
  }

  get base() {
    return this.game.cells.some((c) => this.is(c.owner));
  }
  get occupied() {
    return this.game.cells.filter((c) => this.is(c.owner));
  }
  get attacking() {
    return this.game.cells.some((c) => this.is(c.attacker));
  }
  get score() {
    return this.occupied.reduce(
      (acc, c) => acc + (c.gold ? this.game.goldWorth : 1),
      0
    );
  }

  is(x?: User) {
    return x?.uuid === this.uuid;
  }

  toJSON(): IUser {
    return {
      u: this.uuid,
      n: this.name,
      h: this.hue,
      o: this.occupied.length,
      a: Number(this.attacking) as 0 | 1,
      s: this.score,
    };
  }
}
