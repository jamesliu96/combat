import { Application, Router } from 'https://deno.land/x/railgun@v0.3.5/mod.ts';
import { parse } from 'https://deno.land/std@0.190.0/flags/mod.ts';
import { serveDir } from 'https://deno.land/std@0.190.0/http/file_server.ts';
import { Game } from './game.ts';
import { User } from './user.ts';

const game = new Game(30, 30, 10);

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

await new Application()
  .use(
    new Router()
      .all('/game', (ctx) => {
        ctx.body = game;
      })
      .all('/ws', (ctx) => {
        const { response, socket } = Deno.upgradeWebSocket(ctx.request);
        ctx.response = response;
        const user = new User(game);
        game.users.add(user);
        log('welcome', user);
        socket.onmessage = ({ data }) => {
          try {
            data = JSON.parse(data) ?? {};
          } catch {
            data = {};
          }
          const { $, u, g, n, h, x, y } = data;
          const _: Record<string, unknown> = { $ };
          if (u) _.u = user;
          if (g) _.g = game.toJSON(user);
          if (typeof n === 'string') {
            const name = n.slice(0, 8);
            user.name = name;
            log('name', user, `'${user.name}'`, '->', `'${name}'`);
            _.u = user;
          }
          if (typeof h === 'number') {
            const hue = Math.floor(h % 360);
            user.hue = hue;
            log('hue', user, user.hue, '->', hue);
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
      .all('/.*', async (ctx) => {
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
        console.log(
          `server starts listening at :${(listener.addr as Deno.NetAddr).port}`
        );
      },
    }
  );
