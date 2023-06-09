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

  get based() {
    return this.game.cells.some((c) => this.is(c.owner));
  }
  get attacking() {
    return this.game.cells.some((c) => this.is(c.attacker));
  }
  get energy() {
    return this.game.cells.reduce(
      (acc, c) => acc + Number(this.is(c.owner) && c.energy),
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
    };
  }
}
