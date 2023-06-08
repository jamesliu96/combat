import { Application, Router } from 'https://deno.land/x/railgun@v0.4.0/mod.ts';
import { parse } from 'https://deno.land/std@0.190.0/flags/mod.ts';
import { serveDir } from 'https://deno.land/std@0.190.0/http/file_server.ts';
import { Game } from './game.ts';
import { User } from './user.ts';

const game = new Game(30, 30, 10, 10);

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

const args = parse<{ p: unknown; port: unknown }>(Deno.args);
const port = Number(args.p) || Number(args.port) || Number(args._[0]) || 3000;

const getUser = (v: unknown) =>
  typeof v === 'string' && v
    ? Array.from(game.users).find((u) => u.uuid === v)
    : undefined;

await new Application()
  .use(
    new Router()
      .get('/g', (ctx) => {
        ctx.body = game.toJSON(getUser(ctx.URL.searchParams.get('v')));
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
          const { $, u, n, h, x, y } = data;
          const _: Record<string, unknown> = { $ };
          if (u) _.u = user;
          if (typeof n === 'string') {
            const name = n.slice(0, 8);
            log('name', user, `'${user.name}'`, '->', `'${name}'`);
            user.name = name;
            _.u = user;
          }
          if (typeof h === 'number') {
            const hue = Math.floor(h % 360);
            log('hue', user, user.hue, '->', hue);
            user.hue = hue;
            _.u = user;
          }
          if (typeof x === 'number' && typeof y === 'number') {
            const a = game.attack(x, y, user);
            _.a = Number(a);
            log('attack', user, { x, y }, a);
          }
          try {
            socket.send(JSON.stringify(_));
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
