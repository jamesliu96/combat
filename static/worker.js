importScripts('uuid.js');

const AsyncFunction = async function () {}.constructor;

/** @param {number} t */
const sleep = (t) => new Promise((r) => setTimeout(r, t));

const pool = new Map();
const invoke = (n, a) => {
  const $ = crypto.randomUUID();
  return new Promise((resolve) => {
    pool.set($, resolve);
    try {
      postMessage({ $, n, a });
    } catch (err) {
      console.error(err);
    }
  });
};

let id;
onmessage = ({ data: { $, d, c, i, s, f } }) => {
  if ($) {
    pool.get($)?.(d);
    pool.delete($);
    return;
  }
  const cid = crypto.randomUUID();
  id = cid;
  pool.clear();
  const F = new AsyncFunction(s, c);
  const Combat = f.reduce(
    (acc, fn) => ({ ...acc, [fn]: (...args) => invoke(fn, args) }),
    {}
  );
  (async () => {
    while (cid === id) {
      await F(Combat);
      await sleep(i);
    }
  })();
};
