type binary = 0 | 1;

interface IUser {
  /** UUID */
  u: string;
  /** Name */
  n: string;
  /** Hue */
  h: number;
}

interface ICell {
  /** x-coordinate */
  x: number;
  /** y-coordinate */
  y: number;
  /** Gold binary */
  g: binary;
  /** Energy binary */
  e: binary;
  /** Blast binary */
  b: binary;
  /** Owner's UUID */
  o: string;
  /** Attacker's UUID */
  a: string;
  /** Owned at */
  s: number;
  /** Attacked at */
  d: number;
  /** To be owned at */
  f: number;
}

interface IGame {
  /** Width */
  w: number;
  /** Height */
  h: number;
  /** Total gold count */
  g: number;
  /** Total energy count */
  e: number;
  /** Worth */
  v: number;
  /** Gold worth */
  s: number;
  /** Energy ratio */
  r: number;
  /** Idle take time */
  i: number;
  /** Minimum take time */
  a: number;
  /** Maximum take time */
  z: number;
  /** Convergence */
  m: number;
  /** Cells */
  c: ICell[];
  /** Users */
  u: IUser[];
  /** Time */
  t: number;
}

interface Blast {
  Square: 1;
  Horizontal: 2;
  Vertical: 3;
}

interface Helpers {
  /** Blast */
  readonly Blast: Readonly<Blast>;
  /** Get cell */
  getCell(g: IGame, x: number, y: number): ICell | undefined;
  /** Whether the cell is owned by user */
  isCellOwnedBy(c: ICell, u: IUser): boolean;
  /** Whether the cell is being attacked by user */
  isCellAttackedBy(c: ICell, u: IUser): boolean;
  /** Get adjacent cells (by user) */
  getAdjCells(g: IGame, c: ICell, u?: IUser): ICell[];
  /** Get owned cells */
  getUserOwnedCells(g: IGame, u: IUser): ICell[];
  /** Whether user has base */
  hasUserBase(g: IGame, u: IUser): boolean;
  /** Whether user is attacking */
  isUserAttacking(g: IGame, u: IUser): boolean;
  /** Get cell time cost (by user) */
  getCellTime(g: IGame, c: ICell, u?: IUser): number;
  /** Get user energy */
  getUserEnergy(g: IGame, u: IUser): number;
  /** Get user score */
  getUserScore(g: IGame, u: IUser): number;
  /** Calculate distance between two cells */
  calcDist(a: ICell, b: ICell): number;
}

declare const Helpers: Helpers;

interface Game {
  /** Fetch user */
  fetchUser(): Promise<{ u: IUser }>;
  /** Fetch game */
  fetchGame(): Promise<{ g: IGame }>;
  /** Update user name */
  updateUserName(n: string): Promise<{ u: IUser }>;
  /** Update user hue */
  updateUserHue(h: number): Promise<{ u: IUser }>;
  /** Attack a cell */
  attack(x: number, y: number, z?: Blast[keyof Blast]): Promise<void>;
  /** Output log */
  log(...args: unknown[]): Promise<void>;
}

declare const Game: Game;
