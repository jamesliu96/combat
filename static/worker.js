importScripts('uuid.js');

const AsyncFunction = async function () {}.constructor;

const sleep = (t = 0) =>
  new Promise((r) => {
    setTimeout(r, t);
  });

const pool = new Map();
const invoke = (n, a) => {
  const $ = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    pool.set($, resolve);
    try {
      postMessage({ $, n, a });
    } catch (err) {
      reject(err);
    }
  });
};

let id;
onmessage = ({ data: { $, d, c, i, x, s, f } }) => {
  if ($) {
    pool.get($)?.(d);
    pool.delete($);
    return;
  }
  pool.clear();
  const cid = crypto.randomUUID();
  id = cid;
  const F = new AsyncFunction(s, c);
  const Combat = f.reduce(
    (acc, fn) => ({ ...acc, [fn]: (...args) => invoke(fn, args) }),
    {}
  );
  (async () => {
    while (cid === id) {
      await Promise.all([
        F(Combat).catch((err) => {
          console.error(err);
          if (!x) throw err;
        }),
        sleep(i),
      ]);
    }
  })();
};
