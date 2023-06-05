interface ICell {
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

interface IUser {
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

interface IGame {
  /** Width */
  w: number;
  /** Height */
  h: number;
  /** Cells */
  c: ICell[];
  /** Users */
  u: IUser[];
  /** Idle(unclaimed) take time */
  i: number;
  /** Minimum take time */
  a: number;
  /** Maximum take time */
  z: number;
  /** Current time */
  t: number;
}

type Combat = {
  /** Attack a cell at \`(x,y)\` coordinate */
  attack: (x: number, y: number) => Promise<{ a: number }>;
  /** Fetch current user */
  fetchUser: () => Promise<{ u: IUser }>;
  /** Fetch game */
  fetchGame: () => Promise<{ g: IGame }>;
  /** Fetch current user & game */
  fetchUserGame: () => Promise<{ u: IUser; g: IGame }>;
  /** Update user nickname */
  updateName: (n: string) => Promise<{ u: IUser }>;
  /** Update user hue */
  updateHue: (h: number) => Promise<{ u: IUser }>;
  /** Output log */
  log: (...args: unknown[]) => Promise<void>;
};

declare const Combat: Combat;
