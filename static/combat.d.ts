interface IUser {
  /** UUID */
  u: string;
  /** Name */
  n: string;
  /** Hue */
  h: number;
  /** Owned count */
  o: number;
  /** Attack count */
  a: number;
  /** Score */
  s: number;
  /** Energy */
  e: number;
}

interface ICell {
  /** x-coordinate */
  x: number;
  /** y-coordinate */
  y: number;
  /** Gold binary */
  g: 0 | 1;
  /** Energy binary */
  e: 0 | 1;
  /** Owner's UUID, empty if unclaimed */
  o: string;
  /** Attacker's UUID, empty if at peace */
  a: string;
  /** Claimed at timestamp (ms) */
  c: number;
  /** Attack begins at timestamp (ms) */
  b: number;
  /** Under attack until, to be claimed at timestamp (ms) */
  u: number;
  /** Time cost to occupy (ms) */
  t: number;
}

interface IGame {
  /** Width */
  w: number;
  /** Height */
  h: number;
  /** Gold count */
  g: number;
  /** Energy count */
  e: number;
  /** Worth */
  v: number;
  /** Gold worth */
  s: number;
  /** Energy ratio */
  r: number;
  /** Idle take time (ms) */
  i: number;
  /** Minimum take time (ms) */
  a: number;
  /** Maximum take time (ms) */
  z: number;
  /** Cells */
  c: ICell[];
  /** Users */
  u: IUser[];
  /** Current time (ms) */
  t: number;
}

type Combat = {
  /** Attack a cell */
  attack: (x: number, y: number) => Promise<{ a: 0 | 1 }>;
  /** Fetch user */
  fetchUser: () => Promise<{ u: IUser }>;
  /** Fetch game */
  fetchGame: (u?: string | 0 | null) => Promise<{ g: IGame }>;
  /** Update user name */
  updateName: (n: string) => Promise<{ u: IUser }>;
  /** Update user hue */
  updateHue: (h: number) => Promise<{ u: IUser }>;
  /** Output log */
  log: (...args: unknown[]) => Promise<void>;
};

declare const Combat: Combat;
