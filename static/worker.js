importScripts('common.js');

/** @type {Game} */
// deno-lint-ignore no-unused-vars
const Game = new Proxy(
  {},
  {
    get(_, fn) {
      return (...args) => _invoke(fn, args);
    },
  }
);

const AsyncFunction = async function () {}.constructor;

const sleep = (t = 0) =>
  new Promise((r) => {
    setTimeout(r, t);
  });

const _pool = new Map();
const _invoke = (n, a) => {
  const $ = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    _pool.set($, resolve);
    try {
      postMessage({ $, n, a });
    } catch (err) {
      reject(err);
    }
  });
};

let _id;

onmessage = ({ data: { $, d, c, t, x, s } }) => {
  if ($) {
    _pool.get($)?.(d);
    _pool.delete($);
    return;
  }
  _pool.clear();
  const id = crypto.randomUUID();
  _id = id;
  if (s) return;
  const F = new AsyncFunction(c);
  (async () => {
    while (id === _id) {
      await Promise.all([
        ...(t > 0 ? [sleep(t)] : []),
        F().catch((err) => {
          console.error(err);
          if (!x) throw err;
        }),
      ]);
    }
  })();
};
