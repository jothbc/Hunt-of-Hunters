import Player from "./Player.js";

const canvas = document.querySelector('#root');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const on = window.addEventListener;
const off = window.removeEventListener;
const dispatch = window.dispatchEvent;

function game(initialPlayer, previousPlayers, mapConfig) {

  console.log(initialPlayer, previousPlayers, mapConfig);
  const fps = 30;
  const interval = 1000 / fps;
  let lastTime = 0;

  const self = new Player({ ...initialPlayer, controller: true }, ctx);
  let players = new Map([
    [self.nickname, self],
    ...previousPlayers.map(player => [player.nickname, new Player({ ...player, controller: false }, ctx)])
  ]);


  function clearScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  function renderPlayers() {
    players.forEach(player => {
      player.render();
    });
  }

  function update() {
    players.forEach(player => {
      player.tick();
    })
  }
  function renderGrid() {
    for (let x = 0; x < canvas.width; x += canvas.width / 20) {
      for (let y = 0; y < canvas.height; y += canvas.height / 20) {
        ctx.fillStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, canvas.width / 20, canvas.height / 20);
      }
    }
  }
  function renderVirtualCamera() {
    const cameraX = Math.max(0, Math.min(self.position.x - canvas.height / 2, mapConfig.width - canvas.height));
    const cameraY = Math.max(0, Math.min(self.position.y - canvas.width / 2, mapConfig.height - canvas.width));
    const blockSize = 50;

    for (let y = Math.floor(cameraY); y < Math.ceil(cameraY + canvas.height); y++) {
      for (let x = Math.floor(cameraX); x < Math.ceil(cameraX + canvas.width); x++) {
        const block = mapConfig.map[y] && mapConfig.map[y][x];
        if (block !== undefined) {
          ctx.fillStyle = block === 0 ? 'black' : block === 1 ? 'gray' : 'orange';
          ctx.fillRect((x - cameraX) * blockSize, (y - cameraY) * blockSize, blockSize, blockSize);
        }
      }
    }
  }

  function render() {
    clearScreen();
    renderVirtualCamera();
    renderPlayers();
    // renderGrid();
  }

  function gameLoop(time) {
    const delta = time - lastTime;
    if (delta > interval) {
      lastTime = time - (delta % interval);
      update();
      render();
    }
    requestAnimationFrame(gameLoop); // game loop

  }
  gameLoop();
  on('ws', (event) => {
    const { data, type } = event.detail;
    console.log(event);
    switch (type) {
      case 'update':
        data.forEach(playerUpdateData => {
          players.get(playerUpdateData.nickname).updateWS(playerUpdateData);
        })
        break;
      case 'newPlayer':
        players.set(data.nickname, new Player({ ...data, controller: false }, ctx));
        break;
      case 'disconnect':
        data.nickname && players.delete(data.nickname);
        break;
      case 'syncMove':
        self.syncMove(data);
        break;
      default:
        break;
    }
  });
  on('keypress', (e) => {
    if (e.key === 'h') {
      window.debug_mode = !window.debug_mode;
    }
  });
}

function menu(bg) {
  const fps = 30;
  const interval = 1000 / fps;
  let lastTime = 0;
  let pulseEffect = {
    fontSize: 24,
    minFontSize: 24,
    maxFontSize: 32,
    onIncrease: true,
    increase: 0.2,
  }
  let frameAnimation = 0;
  const STATUS = {
    INIT: 0,
    REQUEST_NICK: 1,
    CONNECTING: 2,
    ERROR: 3,
  }

  let actualStatus = STATUS.INIT;
  let nickname = '';
  let mapConfig = {
    width: 0,
    height: 0,
    map: []
  };

  function update() {
    if (pulseEffect.onIncrease) {
      if (pulseEffect.fontSize < pulseEffect.maxFontSize) {
        pulseEffect.fontSize += pulseEffect.increase;
      } else {
        pulseEffect.onIncrease = false;
      }
    }
    if (!pulseEffect.onIncrease) {
      if (pulseEffect.fontSize > pulseEffect.minFontSize) {
        pulseEffect.fontSize -= pulseEffect.increase;
      } else {
        pulseEffect.onIncrease = true;
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear the canvas
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height); // draw the background image

    const center = {
      x: canvas.width / 2,
      y: canvas.height / 2,
    }

    // draw the title
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 80px sans-serif';
    ctx.fillText('HUNT OF HUNTERS', center.x, center.y);

    if (actualStatus === STATUS.INIT) {
      ctx.font = `bold ${pulseEffect.fontSize}px sans-serif`;
      ctx.fillText('Press any key to start the game', center.x, center.y + 32 + 16);
    }
    else if (actualStatus === STATUS.REQUEST_NICK) {
      ctx.font = `bold ${pulseEffect.maxFontSize}px sans-serif`;
      ctx.fillText('Enter your nickname', center.x, center.y + 32 + 16);
      ctx.fillText(nickname, center.x, center.y + 32 + 16 + 32 + 16);
      if (nickname) {
        ctx.font = `bold ${pulseEffect.fontSize}px sans-serif`;
        ctx.fillText('Press any key to continue', center.x, center.y + 32 + 16 + 32 + 32 + 32);
      }
    }
    else if (actualStatus === STATUS.CONNECTING) {
      ctx.font = `bold ${pulseEffect.maxFontSize}px sans-serif`;
      ctx.fillText('Connecting...', center.x, center.y + 32 + 16);
    }
    else if (actualStatus === STATUS.ERROR) {
      ctx.font = `bold ${pulseEffect.maxFontSize}px sans-serif`;
      ctx.fillText('Error when try connect with websocket', center.x, center.y + 32 + 16);
      ctx.fillText('Press any key to try again', center.x, center.y + 32 + 16 + 32);
    }
  }

  function menuLoop(time) {
    const delta = time - lastTime;
    if (delta > interval) {
      lastTime = time - (delta % interval);
      update();
      render();
    }
    frameAnimation = requestAnimationFrame(menuLoop); // menu loop
  }
  frameAnimation = requestAnimationFrame(menuLoop); // menu loop

  function initKeyListeneer() {

    function menuListener(event) {
      if (actualStatus === STATUS.INIT) {
        actualStatus = STATUS.REQUEST_NICK;
      }
      else if (actualStatus === STATUS.REQUEST_NICK) {
        if (event.key === 'Backspace') {
          nickname = nickname.substring(0, nickname.length - 1);
        }
        else if (event.key === 'Enter') {
          if (nickname) {
            actualStatus = STATUS.CONNECTING;
            on('ws', (event) => {
              const { type, data, previousPlayers } = event.detail;
              if (type === 'success') {
                off('keydown', menuListener);
                cancelAnimationFrame(frameAnimation);
                game(data, previousPlayers, mapConfig);
              } else {
                actualStatus = STATUS.ERROR;
              }
            }, { once: true });
            window.ws.send('join', {
              name: 'skull',
              nickname
            })
          }
        }
        else if (/^([a-zA-Z0-9_]{1})$/.test(event.key)) {
          nickname += event.key;
        }

      }
      if (actualStatus === STATUS.ERROR) {
        actualStatus = STATUS.REQUEST_NICK;
      }

    }
    on('keydown', menuListener);
  }
  initKeyListeneer();
  window.ws.send('init');
  on('ws', ({ detail }) => {
    if (detail.type === 'init') {
      mapConfig = detail.data;
    }
  }, { once: true });
}

async function init() {
  const bg = await new Promise(resolve => {
    const bg = new Image();
    bg.onload = () => resolve(bg);
    bg.src = './assets/images/menu/bg.jpg';
  })

  menu(bg);
}

init();


function instanceWebsocket() {
  const websocket = new WebSocket('ws://192.168.2.120:3333');
  websocket.addEventListener('open', () => {
    window.ws = {
      send: (type, data) => {
        websocket.send(JSON.stringify({
          type,
          data,
        }));
      },
    };
  })

  websocket.addEventListener('message', (event) => {
    try {
      const detail = JSON.parse(event.data);
      dispatch(new CustomEvent('ws', { detail }));
    } catch (err) {
      console.log(err);
    }
  })

  websocket.addEventListener('close', () => {
    console.log('connection closed');
  })

  websocket.addEventListener('error', (event) => {
    console.log(event);
  })
}
instanceWebsocket();

