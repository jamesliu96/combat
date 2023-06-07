addEventListener('load', () => {
  /** @param {number} t */
  const sleep = (t) => new Promise((r) => setTimeout(r, t));
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
    if (!$board.hasChildNodes()) {
      $board.append(
        ...Array.from(Array(g.c.length), (_, idx) => {
          const $cell = document.createElement('div');
          $cell.className = 'cell';
          if (!v) {
            const { x, y } = g.c[idx];
            $cell.addEventListener('click', () => {
              Combat.attack(x, y);
            });
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
  const $name = document.querySelector('#name');
  const $set = document.querySelector('#set');
  const $color = document.querySelector('#color');
  const $board = document.querySelector('.board');
  const $uuid = document.querySelector('#uuid');
  const $editor = document.querySelector('#editor');
  const $save = document.querySelector('#save');
  const $load = document.querySelector('#load');
  const $int = document.querySelector('#int');
  const $run = document.querySelector('#run');
  const $logger = document.querySelector('#logger');
  const $clear = document.querySelector('#clear');

  $rank.append(
    ...Array.from(Array(9), () => {
      const $r = document.createElement('div');
      $r.title = '$: score; #: occupied; *: energy';
      return $r;
    })
  );

  const VIEW = new URLSearchParams(location.search).get('view');

  if (VIEW !== null) {
    document
      .querySelectorAll('.logic')
      .forEach(($e) => $e.style.setProperty('display', 'none'));
    $uuid.style.setProperty('display', 'none');
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

  /** @type {Combat} */
  const Combat = {
    attack: (x, y) => send({ x, y }),
    fetchUser: (u) => send({ u: u || 1 }),
    fetchGame: (u) => send({ g: u || 1 }),
    fetchUserGame: (u) => send({ u: u || 1, g: u || 1 }),
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
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });
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
    return new Promise((resolve) => {
      pool.set($, resolve);
      try {
        socket.send(JSON.stringify({ $, ...d }));
      } catch (err) {
        console.error(err);
      }
    });
  };
  const socket = new WebSocket(`ws://${location.host}/ws`);
  socket.onopen = async () => {
    const { u, g } = await Combat.fetchUserGame();
    refreshUser(u);
    refreshGame(g);
    (async () => {
      for (;;) {
        await sleep(100);
        refreshGame((await Combat.fetchGame()).g);
      }
    })();
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
  $run.addEventListener('click', () => {
    worker.postMessage({
      c: editor?.getValue(),
      i: parseInt($int.value),
      s: 'Combat',
      f: Object.keys(Combat),
    });
  });
  $clear.addEventListener('click', () => {
    $logger.value = '';
  });
  const worker = new Worker('worker.js');
  worker.onmessage = async ({ data: { $, n, a } }) => {
    worker.postMessage({ $, d: await Combat[n]?.(...a) });
  };
});
