import {
  Application,
  Router,
  STATUS_CODE,
  STATUS_TEXT,
} from 'https://deno.land/x/railgun@v0.6.3/mod.ts';
import { serveDir } from 'https://deno.land/std@0.224.0/http/file_server.ts';
import { parseArgs } from 'https://deno.land/std@0.224.0/cli/parse_args.ts';
import { Game } from './game.ts';
import { User } from './user.ts';

const log = (
  type: string,
  user?: User,
  ...args: Parameters<typeof console.log>
) => {
  console.log(
    `[${new Date().toISOString()}] ${type}${
      user ? ` ${user.name}{${user.uuid}}` : ''
    }`,
    ...args
  );
};

const args = parseArgs<Record<'p' | 'w' | 'h' | 'g' | 'e' | 'b', unknown>>(
  Deno.args
);
const port = Number(args.p || args._[0]) || 3000;
const width = Number(args.w) || 30;
const height = Number(args.h) || 30;
const gold = Number(args.g) || 0;
const energy = Number(args.e) || 0;
const blast = Number(args.b) || 0;

const game = new Game(width, height, gold, energy, blast);

new Application()
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
        socket.onclose = socket.onerror = () => {
          log('bye', user);
          game.users.delete(user);
        };
      })
      .get('/.*', async (ctx) => {
        ctx.response = await serveDir(ctx.request, {
          fsRoot: 'static',
          quiet: true,
        });
      })
      .handle()
  )
  .serve({
    port,
    onListen: ({ port }) => {
      log(`server starts listening at :${port}`);
    },
    onError(error) {
      return new Response(`${error}`, {
        status: STATUS_CODE.InternalServerError,
        statusText: STATUS_TEXT[STATUS_CODE.InternalServerError],
      });
    },
  });
