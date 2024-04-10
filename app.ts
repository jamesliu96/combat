import { Application, Router } from 'https://deno.land/x/railgun@v0.5.3/mod.ts';
import { serveDir } from 'https://deno.land/std@0.221.0/http/file_server.ts';
import { parseArgs } from 'https://deno.land/std@0.221.0/cli/parse_args.ts';
import { Game } from './game.ts';
import { User } from './user.ts';

const game = new Game(30, 30, 10, 10, 10);

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

const args = parseArgs<{ p: unknown; port: unknown }>(Deno.args);
const port = Number(args.p) || Number(args.port) || Number(args._[0]) || 3000;

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
        log('welcome', user);
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
            const name = n.slice(0, 8);
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
            log('attack', user, { x, y, z });
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
