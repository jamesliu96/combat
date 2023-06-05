import { Game } from './game.ts';
import { User } from './user.ts';

export class Cell {
  owner?: User;
  attacker?: User;

  ownedAt = 0;
  attackedAt = 0;
  takenAt = 0;

  constructor(readonly game: Game, readonly x: number, readonly y: number) {}

  get takeTime() {
    return this.owner
      ? (this.game.max - this.game.min) *
          2 ** (-(this.game.now - this.ownedAt) / this.game.conv) +
          this.game.min
      : this.game.idle;
  }

  update() {
    if (this.attacker && this.game.now > this.takenAt) {
      this.owner = this.attacker;
      this.attacker = undefined;
      this.ownedAt = this.takenAt;
      this.attackedAt = 0;
      this.takenAt = 0;
    }
  }

  attack(user: User) {
    this.attacker = user;
    this.attackedAt = this.game.now;
    this.takenAt = this.attackedAt + this.takeTime;
  }

  protected toJSON() {
    return {
      x: this.x,
      y: this.y,
      o: this.owner?.uuid ?? '',
      a: this.attacker?.uuid ?? '',
      ot: this.ownedAt,
      at: this.attackedAt,
      tt: this.takenAt,
      t: this.takeTime,
    };
  }
}
