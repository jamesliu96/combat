importScripts('uuid.js');

const AsyncFunction = async function () {}.constructor;

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

let int;
onmessage = ({ data: { $, d, c, i, s, f } }) => {
  if ($) {
    pool.get($)?.(d);
    pool.delete($);
    return;
  }
  clearInterval(int);
  pool.clear();
  const F = new AsyncFunction(s, c);
  const Combat = f.reduce(
    (acc, fn) => ({ ...acc, [fn]: (...args) => invoke(fn, args) }),
    {}
  );
  F(Combat);
  int = setInterval(() => {
    F(Combat);
  }, i);
};
