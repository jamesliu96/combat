addEventListener('load', () => {
  /** @type {Game} */
  const Game = {
    async fetchUser() {
      return this._user ? { u: this._user } : await send({ u: 1 });
    },
    fetchGame: async (_) =>
      _ ? { g: await (await fetch('g')).json() } : send({ g: 1 }),
    updateUserName: (n) => send({ n }),
    updateUserHue: (h) => send({ h }),
    attack: (x, y, z) => send(z ? { x, y, z } : { x, y }),
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

  const frame = () => new Promise(requestAnimationFrame);
  /** @param {number} h */
  const invertHue = (h) => (h + 180) % 360;

  /** @param {IUser} u */
  const refreshUser = (u) => {
    Game._user = u;
    $uuid.textContent = u.u;
    $name.value = u.n;
    $color.style.setProperty('--h', `${u.h}deg`);
    $color.style.setProperty('--r', `${invertHue(u.h)}deg`);
  };
  /**
   * @param {IGame} g
   * @param {string|null} v
   */
  const refreshGame = (g, v = '') => {
    $ping.textContent = (Date.now() - g.t).toFixed();
    const hues = {};
    const getHue = (id) => {
      if (!id) return;
      if (typeof hues[id] !== 'undefined') return hues[id];
      const hue = g.u.find(({ u }) => u === id)?.h;
      if (typeof hue !== 'undefined') {
        hues[id] = hue;
        return hue;
      }
    };
    if ($board.childElementCount !== g.c.length) {
      $board.textContent = '';
      $board.style.setProperty('--w', `${g.w}`);
      $board.append(
        ...Array.from(Array(g.c.length), (_, idx) => {
          const $cell = document.createElement('div');
          $cell.className = 'cell';
          const { x, y } = g.c[idx];
          $cell.onclick = () => {
            Game.attack(x, y);
          };
          $cell.oncontextmenu = (e) => {
            e.preventDefault();
            Game.attack(
              x,
              y,
              e.metaKey || e.ctrlKey
                ? Helpers.Blast.Horizontal
                : e.shiftKey
                ? Helpers.Blast.Vertical
                : Helpers.Blast.Square
            );
          };
          return $cell;
        })
      );
    }
    g.c.forEach((c, idx) => {
      const $cell = $board.children.item(idx);
      if ($cell) {
        const t = Helpers.getCellTime(
          g,
          c,
          v ? g.u.find(({ u }) => u === v) : Game._user
        );
        const hueO = getHue(c.o);
        const hueA = getHue(c.a);
        const hueOV = typeof hueO !== 'undefined';
        const hueAV = typeof hueA !== 'undefined';
        $cell.style.setProperty(
          '--o',
          hueOV
            ? `hsl(${hueO}deg, 100%, ${100 - ((t - g.a) / (g.z - g.a)) * 50}%)`
            : 'white'
        );
        $cell.style.setProperty(
          '--a',
          hueAV ? `hsl(${hueA}deg, 100%, 50%)` : 'white'
        );
        $cell.style.setProperty(
          '--p',
          `${(c.a ? (c.f - g.t) / (c.f - c.d) : 1) * 100}%`
        );
        $cell.style.setProperty('--h', hueOV ? `${invertHue(hueO)}deg` : null);
        if (c.g) $cell.classList.add('gold');
        else $cell.classList.remove('gold');
        if (c.e) $cell.classList.add('energy');
        else $cell.classList.remove('energy');
        if (c.b) $cell.classList.add('blast');
        else $cell.classList.remove('blast');
        if (
          (v && (c.o === v || c.a === v)) ||
          (Game._user &&
            (Helpers.isCellOwnedBy(c, Game._user) ||
              Helpers.isCellAttackedBy(c, Game._user)))
        )
          $cell.classList.add('self');
        else $cell.classList.remove('self');
        $cell.textContent = (t / 1e3).toFixed();
      }
    });
    const rank = g.u
      .map((u) => {
        const s = Helpers.getUserScore(g, u);
        return { ...u, s };
      })
      .filter(({ s }) => s)
      .sort((a, b) => b.s - a.s);
    Array.from($rank.children).forEach(($p, idx) => {
      const u = rank[idx];
      const hue = getHue(u?.u);
      const hueV = typeof hue !== 'undefined';
      $p.style.setProperty('--h', hueV ? `${hue}deg` : null);
      $p.style.setProperty('--r', hueV ? `${invertHue(hue)}deg` : null);
      if (u && Helpers.isUserAttacking(g, u)) $p.classList.add('attack');
      else $p.classList.remove('attack');
      if ((v && u?.u === v) || (Game._user && u?.u === Game._user.u))
        $p.classList.add('self');
      else $p.classList.remove('self');
      if (u) $p.classList.add('active');
      else $p.classList.remove('active');
      $p.onclick = u
        ? () => {
            open(`?view=${u.u}`);
          }
        : null;
      $p.textContent = u
        ? `${u.n || u.u.slice(0, 8)} ($${u.s}) [#${
            Helpers.getUserOwnedCells(g, u).length
          }] [*${Helpers.getUserEnergy(g, u)}]`
        : '';
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
  const $game = document.querySelector('.game');
  const $rank = document.querySelector('.rank');
  $rank.style.setProperty('--w', '3');
  $rank.append(
    ...Array.from(Array(9), () => {
      const $p = document.createElement('div');
      $p.className = 'player';
      $p.title = '$: score; #: owned; *: energy';
      return $p;
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
  const $kill = document.querySelector('#kill');
  const $logger = document.querySelector('#logger');
  const $clear = document.querySelector('#clear');

  const search = new URLSearchParams(location.search);

  if (search.has('lazy')) {
    $update.checked = false;
    $update.indeterminate = true;
  }

  if (search.has('view')) {
    const view = search.get('view');
    $uuid.textContent = view;
    $game.classList.add('view');
    (async () => {
      for (;;) {
        await Promise.all([
          frame(),
          ...($update.checked
            ? [
                Game.fetchGame(1)
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
      vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.47.0/min/vs',
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
      id: 'game-save',
      label: 'Save',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      contextMenuGroupId: '9_cutcopypaste',
      contextMenuOrder: 4,
      run: handleSave,
    });
    editor.addAction({
      id: 'game-load',
      label: 'Load',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyO],
      contextMenuGroupId: '9_cutcopypaste',
      contextMenuOrder: 5,
      run: handleLoad,
    });
    editor.addAction({
      id: 'game-down',
      label: 'Step Down',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Minus],
      contextMenuGroupId: '9_cutcopypaste',
      contextMenuOrder: 6,
      run: handleStepDown,
    });
    editor.addAction({
      id: 'game-up',
      label: 'Step Up',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Equal],
      contextMenuGroupId: '9_cutcopypaste',
      contextMenuOrder: 7,
      run: handleStepUp,
    });
    editor.addAction({
      id: 'game-run',
      label: 'Run',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR],
      contextMenuGroupId: '9_cutcopypaste',
      contextMenuOrder: 8,
      run: handleRun,
    });
    editor.addAction({
      id: 'game-kill',
      label: 'Kill',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB],
      contextMenuGroupId: '9_cutcopypaste',
      contextMenuOrder: 9,
      run: handleKill,
    });
    editor.addAction({
      id: 'game-clear',
      label: 'Clear',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
      contextMenuGroupId: '9_cutcopypaste',
      contextMenuOrder: 10,
      run: handleClear,
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
    refreshUser((await Game.fetchUser()).u);
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
    if ($name.value) refreshUser((await Game.updateUserName($name.value)).u);
  };
  $color.onclick = async () => {
    refreshUser((await Game.updateUserHue(Math.floor(Math.random() * 360))).u);
  };
  $color.oncontextmenu = async (e) => {
    e.preventDefault();
    const h = parseInt(prompt('Hue'));
    if (Number.isInteger(h)) refreshUser((await Game.updateUserHue(h)).u);
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
      t: parseInt($int.value),
      x: $hasty.checked,
    });
  };
  const handleKill = () => {
    worker.postMessage({ s: 1 });
  };
  const handleStepDown = () => {
    $int.stepDown();
  };
  const handleStepUp = () => {
    $int.stepUp();
  };
  $run.onclick = handleRun;
  $kill.onclick = handleKill;
  const handleClear = () => {
    $logger.value = '';
  };
  $clear.onclick = handleClear;
  const worker = new Worker('worker.js');
  worker.onmessage = async ({ data: { $, n, a } }) => {
    worker.postMessage({ $, d: await Game[n]?.(...a) });
  };
  (async () => {
    for (;;) {
      await Promise.all([
        frame(),
        ...($update.checked
          ? [
              Game.fetchGame()
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
});
