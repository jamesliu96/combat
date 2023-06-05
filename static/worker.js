const AsyncFunction = async function () {}.constructor;

if (!('randomUUID' in crypto))
  crypto.randomUUID = function randomUUID() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
      (
        c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
      ).toString(16)
    );
  };

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
