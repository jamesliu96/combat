addEventListener('load', () => {
  /** @type {Combat} */
  const Combat = {
    _uuid: '',
    attack: (x, y) => send({ x, y }),
    fetchUser: () => send({ u: 1 }),
    async fetchGame(u) {
      const v = u === 0 || u === null ? undefined : u || this._uuid;
      return {
        g: await (
          await fetch(
            v
              ? `g?${new URLSearchParams({
                  v,
                })}`
              : 'g'
          )
        ).json(),
      };
    },
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
    $color.style.setProperty('background', `hsl(${u.h}deg, 100%, 50%)`);
    $color.style.setProperty('color', `hsl(${reverseHue(u.h)}deg, 100%, 50%)`);
    $uuid.textContent = u.u;
  };
  /** @param {IGame} g */
  const refreshGame = (g, v) => {
    $ping.textContent = (Date.now() - g.t).toFixed();
    const hues = {};
    const getHue = (id) => {
      if (!id) return;
      if (typeof hues[id] === 'number') return hues[id];
      const hue = g.u.find(({ u }) => u === id)?.h;
      if (typeof hue === 'number') {
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
          if (typeof v !== 'undefined')
            $cell.style.setProperty('cursor', 'default');
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
            typeof hueO === 'number'
              ? `hsl(${hueO}deg, 100%, ${
                  100 - ((c.t - g.a) / (g.z - g.a)) * 50
                }%)`
              : 'white'
          } ${perc}%,${
            typeof hueA === 'number' ? `hsl(${hueA}deg, 100%, 50%)` : 'white'
          } ${perc}%)`
        );
        $cell.style.setProperty(
          'color',
          typeof hueO === 'number'
            ? `hsl(${reverseHue(hueO)}deg, 100%, 50%)`
            : null
        );
        $cell.style.setProperty(
          'box-shadow',
          c.g
            ? 'gold 0 0 5px 0 inset, gold 0 0 5px 1px'
            : c.e
            ? 'skyblue 0 0 5px 0 inset, skyblue 0 0 5px 1px'
            : null
        );
        $cell.textContent = (c.t / 1e3).toFixed();
        $cell.style.setProperty(
          'font-weight',
          (v && (c.o === v || c.a === v)) ||
            (Combat._uuid && (c.o === Combat._uuid || c.a === Combat._uuid))
            ? 'bold'
            : null
        );
      }
    });
    const ranking = g.u.filter(({ s }) => s).sort((a, b) => b.s - a.s);
    Array.from($rank.children).forEach(($r, idx) => {
      const r = ranking[idx];
      const hue = getHue(r?.u);
      $r.style.setProperty(
        'background',
        typeof hue === 'number' ? `hsl(${hue}deg, 100%, 50%)` : null
      );
      $r.style.setProperty(
        'color',
        typeof hue === 'number' ? `hsl(${reverseHue(hue)}deg, 100%, 50%)` : null
      );
      $r.style.setProperty('text-decoration', r?.a ? 'underline' : null);
      $r.style.setProperty(
        'font-weight',
        (v && r?.u === v) || (Combat._uuid && r?.u === Combat._uuid)
          ? 'bold'
          : null
      );
      $r.textContent = r
        ? `${r.n || r.u.slice(0, 8)} ($${r.s}) [#${r.o}] [*${r.e}]`
        : '';
      $r.onclick = r
        ? () => {
            open(`?view=${r.u}`);
          }
        : null;
      $r.style.setProperty('cursor', r ? 'pointer' : null);
    });
  };

  const $ping = document.querySelector('#ping');
  $ping.ondblclick = () => {
    $ping.style.setProperty('visibility', 'hidden');
  };
  const $update = document.querySelector('#update');
  addEventListener('keydown', (e) => {
    if ((e.key === '.' || e.code === 'Period') && (e.ctrlKey || e.metaKey))
      $update.click();
  });
  const $rank = document.querySelector('.rank');
  $rank.style.setProperty('--w', '3');
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
  const $hasty = document.querySelector('#hasty');
  const $run = document.querySelector('#run');
  const $logger = document.querySelector('#logger');
  const $clear = document.querySelector('#clear');

  const view = new URLSearchParams(location.search).get('view');
  if (view !== null) {
    document
      .querySelectorAll('.logic')
      .forEach(($e) => $e.style.setProperty('display', 'none'));
    $uuid.textContent = view;
    $editor.style.setProperty('display', 'none');
    $logger.style.setProperty('display', 'none');
    (async () => {
      for (;;) {
        await Promise.all([
          sleep(100),
          ...($update.checked
            ? [
                Combat.fetchGame(view)
                  .then(({ g }) => {
                    refreshGame(g, view);
                  })
                  .catch((err) => {
                    console.error(err);
                  }),
              ]
            : []),
        ]);
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
    editor.addAction({
      id: 'combat-save',
      label: 'Save',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      contextMenuGroupId: '9_cutcopypaste',
      contextMenuOrder: 4,
      run: handleSave,
    });
    editor.addAction({
      id: 'combat-load',
      label: 'Load',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyO],
      contextMenuGroupId: '9_cutcopypaste',
      contextMenuOrder: 5,
      run: handleLoad,
    });
    editor.addAction({
      id: 'combat-run',
      label: 'Run',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR],
      contextMenuGroupId: '9_cutcopypaste',
      contextMenuOrder: 6,
      run: handleRun,
    });
  });
  const pool = new Map();
  const send = (d) => {
    const $ = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      pool.set($, resolve);
      try {
        socket.send(JSON.stringify({ $, ...d }));
      } catch (err) {
        reject(err);
      }
    });
  };
  const socket = new WebSocket(
    `${location.protocol.startsWith('https') ? 'wss:' : 'ws:'}//${
      location.host
    }${location.pathname}/../s`
  );
  socket.onopen = async () => {
    const { u } = await Combat.fetchUser();
    Combat._uuid = u.u;
    refreshUser(u);
    (async () => {
      for (;;) {
        await Promise.all([
          sleep(100),
          ...($update.checked
            ? [
                Combat.fetchGame()
                  .then(({ g }) => {
                    refreshGame(g);
                  })
                  .catch((err) => {
                    console.error(err);
                  }),
              ]
            : []),
        ]);
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
  const handleSave = () => {
    localStorage.setItem(CODE_KEY, editor?.getValue() || '');
  };
  $save.onclick = handleSave;
  const handleLoad = async () => {
    editor?.setValue(await getValue());
  };
  $load.onclick = handleLoad;
  const handleRun = () => {
    worker.postMessage({
      c: editor?.getValue(),
      i: parseInt($int.value) || 1e3,
      x: $hasty.checked,
      s: 'Combat',
      f: Object.keys(Combat).filter((x) => !x.startsWith('_')),
    });
  };
  $run.onclick = handleRun;
  $clear.onclick = () => {
    $logger.value = '';
  };
  const worker = new Worker('worker.js');
  worker.onmessage = async ({ data: { $, n, a } }) => {
    worker.postMessage({ $, d: await Combat[n]?.(...a) });
  };
});
