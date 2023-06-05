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

  is(x?: User) {
    return x?.uuid === this.uuid;
  }

  protected toJSON(): IUser {
    return {
      u: this.uuid,
      n: this.name,
      h: this.hue,
      o: this.occupied.length,
      a: Number(this.attacking),
    };
  }
}
