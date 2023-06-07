addEventListener('load', () => {
  /** @type {Combat} */
  const Combat = {
    attack: (x, y) => send({ x, y }),
    fetchUser: () => send({ u: 1 }),
    fetchGame: (u) => send({ g: u === 0 || u === null ? 0 : u || 1 }),
    updateName: (n) => send({ n }),
    updateHue: (h) => send({ h }),
    log: (...args) => {
      console.log(...args);
      $logger.value += `${args
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

  const sleep = (t = 0) =>
    new Promise((r) => {
      setTimeout(r, t);
    });
  /** @param {number} h */
  const reverseHue = (h) => (h + 180) % 360;
  /** @param {IUser} u */
  const refreshUser = (u) => {
    $name.value = u.n;
    $color.style.setProperty('background', `hsl(${u.h}, 100%, 50%)`);
    $color.style.setProperty('color', `hsl(${reverseHue(u.h)}, 100%, 50%)`);
    $uuid.textContent = u.u;
  };
  /** @param {IGame} g */
  const refreshGame = (g, v) => {
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
    if ($board.childElementCount !== g.c.length) {
      $board.textContent = '';
      $board.append(
        ...Array.from(Array(g.c.length), (_, idx) => {
          const $cell = document.createElement('div');
          $cell.className = 'cell';
          if (v) $cell.style.setProperty('cursor', 'default');
          else {
            const { x, y } = g.c[idx];
            $cell.onclick = () => {
              Combat.attack(x, y);
            };
          }
          return $cell;
        })
      );
      $board.style.setProperty('--w', `${g.w}`);
    }
    g.c.forEach((c, idx) => {
      const $cell = $board.children.item(idx);
      if ($cell) {
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
          c.g
            ? 'gold 0px 0px 5px 0px inset, gold 0px 0px 5px 1px'
            : c.e
            ? 'skyblue 0px 0px 5px 0px inset, skyblue 0px 0px 5px 1px'
            : null
        );
        $cell.textContent = (c.t / 1000).toFixed();
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
        $r.textContent = `${r.n || r.u.slice(0, 8)} ($${r.s}) [#${r.o}] [*${
          r.e
        }]`;
        $r.onclick = () => {
          open(`?view=${r.u}`);
        };
        $r.style.setProperty('cursor', 'pointer');
      } else {
        $r.style.setProperty('background', null);
        $r.style.setProperty('color', null);
        $r.style.setProperty('text-decoration', null);
        $r.textContent = '';
        $r.onclick = null;
        $r.style.setProperty('cursor', null);
      }
    });
  };

  const $rank = document.querySelector('.rank');
  $rank.append(
    ...Array.from(Array(9), () => {
      const $r = document.createElement('div');
      $r.title = '$: score; #: occupied; *: energy';
      return $r;
    })
  );
  const $name = document.querySelector('#name');
  const $set = document.querySelector('#set');
  const $color = document.querySelector('#color');
  const $board = document.querySelector('.board');
  const $uuid = document.querySelector('#uuid');
  $uuid.ondblclick = () => {
    open('?view');
  };
  const $editor = document.querySelector('#editor');
  const $save = document.querySelector('#save');
  const $load = document.querySelector('#load');
  const $int = document.querySelector('#int');
  const $run = document.querySelector('#run');
  const $logger = document.querySelector('#logger');
  const $clear = document.querySelector('#clear');

  const VIEW = new URLSearchParams(location.search).get('view');

  if (VIEW !== null) {
    document
      .querySelectorAll('.logic')
      .forEach(($e) => $e.style.setProperty('display', 'none'));
    $uuid.textContent = VIEW;
    $editor.style.setProperty('display', 'none');
    $logger.style.setProperty('display', 'none');
    const url = `game${VIEW ? `?v=${VIEW}` : ''}`;
    (async () => {
      for (;;) {
        refreshGame(await (await fetch(url)).json(), true);
        await sleep(100);
      }
    })();
    return;
  }

  const CODE_KEY = 'combat.code';
  let editor, value;
  const getRemoteValue = async () => {
    if (value) return value;
    value = await (await fetch('example.js')).text();
    return value;
  };
  const getValue = async () =>
    localStorage.getItem(CODE_KEY) || (await getRemoteValue());
  require.config({
    paths: {
      vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.38.0/min/vs',
    },
  });
  require(['vs/editor/editor.main'], async () => {
    const LIB_SOURCE = await (await fetch('combat.d.ts')).text();
    const LIB_URI = 'ts:combat.d.ts';
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      LIB_SOURCE,
      LIB_URI
    );
    monaco.editor.createModel(
      LIB_SOURCE,
      'typescript',
      monaco.Uri.parse(LIB_URI)
    );
    editor = monaco.editor.create($editor, {
      theme: 'vs-dark',
      language: 'javascript',
      automaticLayout: true,
      tabSize: 2,
      value: await getValue(),
    });
  });
  const pool = new Map();
  const send = (d) => {
    const $ = crypto.randomUUID();
    return new Promise((r) => {
      pool.set($, r);
      try {
        socket.send(JSON.stringify({ $, ...d }));
      } catch (err) {
        console.error(err);
      }
    });
  };
  const socket = new WebSocket(
    `${location.protocol.startsWith('https') ? 'wss:' : 'ws:'}//${
      location.host
    }/ws`
  );
  socket.onopen = async () => {
    (async () => {
      for (;;) {
        refreshGame((await Combat.fetchGame()).g);
        await sleep(100);
      }
    })();
    refreshUser((await Combat.fetchUser()).u);
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
    $board.style.setProperty('background', 'orangered');
  };
  socket.onclose = handleError;
  socket.onerror = handleError;
  $set.onclick = async () => {
    if ($name.value) refreshUser((await Combat.updateName($name.value)).u);
  };
  $color.onclick = async () => {
    refreshUser((await Combat.updateHue(Math.floor(Math.random() * 360))).u);
  };
  $color.oncontextmenu = async (e) => {
    e.preventDefault();
    const h = parseInt(prompt('Hue'));
    if (Number.isInteger(h)) refreshUser((await Combat.updateHue(h)).u);
  };
  $save.onclick = () => {
    localStorage.setItem(CODE_KEY, editor?.getValue() || '');
  };
  $load.onclick = async () => {
    editor?.setValue(await getValue());
  };
  $run.onclick = () => {
    worker.postMessage({
      c: editor?.getValue(),
      i: parseInt($int.value) || 1000,
      s: 'Combat',
      f: Object.keys(Combat),
    });
  };
  $clear.onclick = () => {
    $logger.value = '';
  };
  const worker = new Worker('worker.js');
  worker.onmessage = async ({ data: { $, n, a } }) => {
    worker.postMessage({ $, d: await Combat[n]?.(...a) });
  };
});
