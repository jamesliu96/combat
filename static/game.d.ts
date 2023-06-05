interface Cell {
  /** x-coordinate */
  x: number;
  /** y-coordinate */
  y: number;
  /** Owner's UUID, empty if unclaimed */
  o: string;
  /** Attacker's UUID, empty if at peace */
  a: string;
  /** Claimed at */
  ot: number;
  /** Attack begins at */
  at: number;
  /** Under attack until, to be claimed at */
  tt: number;
  /** Time cost to occupy */
  t: number;
}

interface User {
  /** UUID */
  u: string;
  /** Nickname */
  n: string;
  /** Hue */
  h: number;
  /** Owned count */
  o: number;
  /** Attacking count */
  a: number;
}

interface Game {
  /** Width */
  w: number;
  /** Height */
  h: number;
  /** Cells */
  c: Cell[];
  /** Users */
  u: User[];
  /** Idle(unclaimed) take time */
  i: number;
  /** Minimum take time */
  a: number;
  /** Maximum take time */
  z: number;
  /** Current time */
  t: number;
}

declare const Game: {
  /** Attack a cell at \`(x,y)\` coordinate */
  attack: (x: number, y: number) => Promise<{ a: number }>;
  /** Fetch current user */
  fetchUser: () => Promise<{ u: User }>;
  /** Fetch game */
  fetchGame: () => Promise<{ g: Game }>;
  /** Fetch current user & game */
  fetchUserGame: () => Promise<{ u: User; g: Game }>;
  /** Update user nickname */
  updateName: (n: string) => Promise<{ u: User }>;
  /** Update user hue */
  updateHue: (h: number) => Promise<{ u: User }>;
  /** Get a cell at \`(x,y)\` coordinate */
  getCell: (game: Game, x: number, y: number) => Cell | undefined;
  /** Calculate distance between two cells */
  calcDistance: (a: Cell, b: Cell) => number;
};

declare const log: typeof console.log;
