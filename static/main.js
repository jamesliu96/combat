addEventListener('load', () => {
  const LIB_URI = 'ts:types/game.d.ts';
  const CODE_KEY = 'combat.code';

  const getValue = async () =>
    localStorage.getItem(CODE_KEY) ||
    (await (await fetch('example.js')).text());

  if (!('randomUUID' in crypto))
    crypto.randomUUID = function randomUUID() {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (
          c ^
          (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
      );
    };

  const $rank = document.querySelector('.rank');
  const $name = document.querySelector('#name');
  const $set = document.querySelector('#set');
  const $color = document.querySelector('#color');
  const $board = document.querySelector('.board');
  const $uuid = document.querySelector('.uuid');
  const $save = document.querySelector('#save');
  const $load = document.querySelector('#load');
  const $int = document.querySelector('#int');
  const $run = document.querySelector('#run');
  const $logger = document.querySelector('#logger');
  const $clear = document.querySelector('#clear');

  /** @param {number} h */
  const reverseHue = (h) => (h + 180) % 360;

  /** @param {IUser} u */
  const refreshUser = (u) => {
    $name.value = u.n;
    $color.style.setProperty('background', `hsl(${u.h}, 100%, 50%)`);
    $color.style.setProperty('color', `hsl(${reverseHue(u.h)}, 100%, 50%)`);
    $uuid.textContent = u.u;
    $uuid.style.setProperty('color', null);
  };
  /** @param {IGame} g */
  const refreshGame = (g) => {
    const hues = {};
    const getHue = (id) => {
      if (!id) return;
      if (id in hues) return hues[id];
      const hue = g.u.find(({ u }) => u === id)?.h;
      if (hue) {
        hues[id] = hue;
        return hue;
      }
    };
    if (!$board.hasChildNodes()) {
      $board.append(
        ...Array.from(Array(g.c.length), (_, idx) => {
          const $cell = document.createElement('div');
          $cell.className = 'cell';
          const { x, y } = g.c[idx];
          $cell.addEventListener('click', () => {
            Combat.attack(x, y);
          });
          return $cell;
        })
      );
      $board.style.setProperty('--w', `${g.w}`);
    }
    g.c.forEach((c, idx) => {
      const $cell = $board.children.item(idx);
      if ($cell) {
        $cell.textContent = `${(c.t / 1000).toFixed()}`;
        const hueO = getHue(c.o);
        const hueA = getHue(c.a);
        const perc = (c.a ? (c.u - g.t) / (c.u - c.b) : 1) * 100;
        $cell.style.setProperty(
          'background',
          `linear-gradient(0deg, ${
            hueO
              ? `hsl(${hueO}, 100%, ${100 - ((c.t - g.a) / (g.z - g.a)) * 50}%)`
              : 'white'
          } ${perc}%,${hueA ? `hsl(${hueA}, 100%, 50%)` : 'white'} ${perc}%)`
        );
        $cell.style.setProperty(
          'color',
          hueO ? `hsl(${reverseHue(hueO)}, 100%, 50%)` : null
        );
        $cell.style.setProperty(
          'box-shadow',
          c.g ? 'gold 0px 0px 5px 0px inset, gold 0px 0px 5px 1px' : null
        );
      }
    });
    const ranking = g.u.filter(({ s }) => s).sort((a, b) => b.s - a.s);
    Array.from($rank.children).forEach(($r, idx) => {
      const r = ranking[idx];
      if (r) {
        const hue = getHue(r.u);
        $r.style.setProperty(
          'background',
          hue ? `hsl(${hue}, 100%, 50%)` : null
        );
        $r.style.setProperty(
          'color',
          hue ? `hsl(${reverseHue(hue)}, 100%, 50%)` : null
        );
        $r.style.setProperty('text-decoration', r.a ? 'underline' : null);
        $r.textContent = `${r.n || r.u.slice(0, 8)} (${r.s})`;
      } else {
        $r.style.setProperty('background', null);
        $r.style.setProperty('color', null);
        $r.style.setProperty('text-decoration', null);
        $r.textContent = '';
      }
    });
  };

  let editor;
  let loop;

  $rank.append(...Array.from(Array(9), () => document.createElement('div')));

  require.config({
    paths: {
      vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.38.0/min/vs',
    },
  });
  require(['vs/editor/editor.main'], async () => {
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });
    const LIB_SOURCE = await (await fetch('combat.d.ts')).text();
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      LIB_SOURCE,
      LIB_URI
    );
    monaco.editor.createModel(
      LIB_SOURCE,
      'typescript',
      monaco.Uri.parse(LIB_URI)
    );
    editor = monaco.editor.create(document.querySelector('#editor'), {
      theme: 'vs-dark',
      language: 'javascript',
      tabSize: 2,
      value: await getValue(),
    });
  });

  const socket = new WebSocket(`ws://${location.host}/ws`);

  const pool = new Map();
  const send = (d) => {
    const $ = crypto.randomUUID();
    return new Promise((resolve) => {
      pool.set($, resolve);
      try {
        socket.send(JSON.stringify({ $, ...d }));
      } catch (err) {
        console.error(err);
      }
    });
  };

  /** @type {Combat} */
  const Combat = {
    attack: (x, y) => send({ x, y }),
    fetchUser: () => send({ u: 1 }),
    fetchGame: () => send({ g: 1 }),
    fetchUserGame: () => send({ u: 1, g: 1 }),
    updateName: (n) => send({ n }),
    updateHue: (h) => send({ h }),
    log: (...args) => {
      console.log(...args);
      $logger.textContent += `${args
        .map((x) => {
          try {
            return JSON.stringify(x);
          } catch {
            return x;
          }
        })
        .join(' ')}\n`;
    },
  };

  socket.onopen = async () => {
    const { u, g } = await Combat.fetchUserGame();
    refreshUser(u);
    refreshGame(g);
    loop = setInterval(async () => {
      const { g } = await Combat.fetchGame();
      refreshGame(g);
    }, 100);
  };
  socket.onmessage = ({ data }) => {
    try {
      data = JSON.parse(data) ?? {};
    } catch {
      data = {};
    }
    const { $ } = data;
    pool.get($)?.(data);
    pool.delete($);
  };
  const handleError = () => {
    clearInterval(loop);
    $uuid.textContent = 'error';
    $uuid.style.setProperty('color', 'orangered');
    $uuid.style.setProperty('cursor', 'pointer');
    $uuid.onclick = () => {
      location.reload();
    };
  };
  socket.onclose = handleError;
  socket.onerror = handleError;

  $set.addEventListener('click', async () => {
    if ($name.value) {
      const { u } = await Combat.updateName($name.value);
      refreshUser(u);
    }
  });
  $color.addEventListener('click', async () => {
    const { u } = await Combat.updateHue(Math.floor(Math.random() * 360));
    refreshUser(u);
  });

  $save.addEventListener('click', () => {
    localStorage.setItem(CODE_KEY, editor?.getValue() || '');
  });
  $load.addEventListener('click', async () => {
    editor?.setValue(await getValue());
  });

  const worker = new Worker('worker.js');
  worker.onmessage = async ({ data: { $, n, a } }) => {
    worker.postMessage({ $, d: await Combat[n]?.(...a) });
  };

  $run.addEventListener('click', () => {
    worker.postMessage({
      c: editor?.getValue(),
      i: parseInt($int.value),
      s: 'Combat',
      f: Object.keys(Combat),
    });
  });
  $clear.addEventListener('click', () => {
    $logger.textContent = '';
  });
});
