import { Application, Router } from 'https://deno.land/x/railgun@v0.5.4/mod.ts';
import { serveDir } from 'https://deno.land/std@0.223.0/http/file_server.ts';
import { parseArgs } from 'https://deno.land/std@0.223.0/cli/parse_args.ts';
import { Game } from './game.ts';
import { User } from './user.ts';

const log = (
  type: string,
  user?: User,
  ...args: Parameters<typeof console.log>
) => {
  const d = new Date().toISOString();
  console.log(
    `[${d.slice(0, 10)} ${d.slice(11, 19)}] ${type}${
      user ? ` ${user.name}{${user.uuid}}` : ''
    }`,
    ...args
  );
};

type Args =
  | 'p'
  | 'port'
  | 'w'
  | 'width'
  | 'h'
  | 'height'
  | 'g'
  | 'gold'
  | 'e'
  | 'energy'
  | 'b'
  | 'blast';
const args = parseArgs<Record<Args, unknown>>(Deno.args);
const port = Number(args.p) || Number(args.port) || Number(args._[0]) || 3000;
const width = Number(args.w) || Number(args.width) || 30;
const height = Number(args.h) || Number(args.height) || 30;
const gold = Number(args.g) || Number(args.gold) || 0;
const energy = Number(args.e) || Number(args.energy) || 0;
const blast = Number(args.b) || Number(args.blast) || 0;

const game = new Game(width, height, gold, energy, blast);

await new Application()
  .use(
    new Router()
      .get('/g', (ctx) => {
        ctx.body = game;
      })
      .get('/s', (ctx) => {
        const socket = ctx.upgrade();
        const user = new User(game);
        game.users.add(user);
        log('hey', user);
        socket.onmessage = ({ data }) => {
          try {
            data = JSON.parse(data) ?? {};
          } catch {
            data = {};
          }
          const { $, g, u, n, h, x, y, z } = data;
          const d: Record<string, unknown> = { $ };
          if (g) d.g = game;
          if (u) d.u = user;
          if (typeof n === 'string') {
            const name = n.slice(0, 16);
            log('name', user, `'${user.name}'`, '->', `'${name}'`);
            user.name = name;
            d.u = user;
          }
          if (typeof h === 'number') {
            const hue = Math.floor(h % 360);
            log('hue', user, user.hue, '->', hue);
            user.hue = hue;
            d.u = user;
          }
          if (typeof x === 'number' && typeof y === 'number') {
            log('attack', user, z ? { x, y, z } : { x, y });
            game.attack(x, y, user, z);
          }
          try {
            socket.send(JSON.stringify(d));
          } catch (err) {
            log('ERR', undefined, err);
          }
        };
        const handleError = () => {
          log('bye', user);
          game.users.delete(user);
        };
        socket.onclose = handleError;
        socket.onerror = handleError;
      })
      .get('/.*', async (ctx) => {
        ctx.response = await serveDir(ctx.request, {
          fsRoot: 'static',
          quiet: true,
        });
      })
      .handle()
  )
  .listen(
    { port },
    {
      onListen: (listener) => {
        log(
          `server starts listening at :${(listener.addr as Deno.NetAddr).port}`
        );
      },
    }
  );
