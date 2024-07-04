import Player from "./Player.js";

const canvasVirtualCamera = document.querySelector('canvas');
const ctxVirtualCamera = canvasVirtualCamera.getContext('2d');
canvasVirtualCamera.width = window.innerWidth;
canvasVirtualCamera.height = window.innerHeight;

const on = window.addEventListener;
const off = window.removeEventListener;
const dispatch = window.dispatchEvent;




async function generateMapSrc(mapConfig) {
  const { blockSize, map } = mapConfig;
  const floorSprite = new Image();
  await new Promise((resolve) => {
    floorSprite.onload = () => {
      resolve();
    };
    floorSprite.src = './assets/images/floor/sprite.png';
  })

  const BLOCKS = {
    0: {
      x: 0 * blockSize,
      y: 0 * blockSize
    },
    1: {
      x: 1 * blockSize,
      y: 0 * blockSize
    },
    2: {
      x: 1 * blockSize,
      y: 2 * blockSize
    },
    3: {
      x: 4 * blockSize,
      y: 3 * blockSize
    }
  }

  const canvasTemp = document.createElement('canvas');
  canvasTemp.width = map[0].length * blockSize;
  canvasTemp.height = map.length * blockSize;
  const ctxTemp = canvasTemp.getContext('2d');

  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      const block = map[y][x];
      ctxTemp.drawImage(
        floorSprite,
        BLOCKS[block].x,
        BLOCKS[block].y,
        blockSize,
        blockSize,
        x * blockSize,
        y * blockSize,
        blockSize,
        blockSize
      );
    }
  }
  const mapImage = new Image();
  await new Promise((resolve, reject) => {
    mapImage.onload = () => {
      resolve();
    };
    mapImage.onerror = () => {
      reject();
    };
    mapImage.src = canvasTemp.toDataURL();
  })
  return mapImage;
}

async function loadSprites() {
  ctxVirtualCamera.font = '30px Arial';
  ctxVirtualCamera.textAlign = 'center';
  ctxVirtualCamera.fillStyle = 'white';
  ctxVirtualCamera.fillText('Carregando sprites...', canvasVirtualCamera.width / 2, canvasVirtualCamera.height / 2);

  const [mapSrc, menuBg] = await Promise.all([
    new Promise((resolve, reject) => {
      on('ws', async ({ detail }) => {
        if (detail.type === 'init') {
          const mapConfig = detail.data;
          const generatedMap = await generateMapSrc(mapConfig);
          resolve(generatedMap);
        } else {
          reject()
        }
      }, { once: true });
      window.ws.send('init');
    }),
    new Promise((resolve, reject) => {
      const bgSprite = new Image();
      bgSprite.onload = () => {
        resolve(bgSprite);
      };
      bgSprite.onerror = () => {
        reject();
      };
      bgSprite.src = './assets/images/menu/bg.jpg';
    })
  ]);

  return {
    mapSrc,
    menuBg
  };
}

function menu({ bg }, initGame) {
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
    CHOOSE_PERSON: 2,
    CONNECTING: 3,
    ERROR: 4,
  }
  const SKINS = {
    skull: 'SKULL',
    skull2: 'RED SKULL',
  }
  let actualStatus = STATUS.INIT;
  let nickname = '';
  let selectedSkin = Object.values(SKINS)[0];
  let mouse = { x: 0, y: 0 };

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
    ctxVirtualCamera.clearRect(0, 0, canvasVirtualCamera.width, canvasVirtualCamera.height); // clear the canvas
    ctxVirtualCamera.drawImage(bg, 0, 0, canvasVirtualCamera.width, canvasVirtualCamera.height); // draw the background image

    const center = {
      x: canvasVirtualCamera.width / 2,
      y: canvasVirtualCamera.height / 2,
    }

    // draw the title
    ctxVirtualCamera.fillStyle = '#fff';
    ctxVirtualCamera.textAlign = 'center';
    ctxVirtualCamera.textBaseline = 'middle';
    ctxVirtualCamera.font = 'bold 80px sans-serif';
    ctxVirtualCamera.fillText('HUNT OF HUNTERS', center.x, center.y);

    let gap = 16;
    let lineHeight = 32;
    let line = lineHeight + gap;
    let lineCount = 1;

    if (actualStatus === STATUS.INIT) {
      ctxVirtualCamera.font = `bold ${pulseEffect.fontSize}px sans-serif`;
      ctxVirtualCamera.fillText('Press any key to start the game', center.x, center.y + line);
    }
    else if (actualStatus === STATUS.REQUEST_NICK) {
      ctxVirtualCamera.font = `bold ${pulseEffect.maxFontSize}px sans-serif`;
      ctxVirtualCamera.fillText('Enter your nickname', center.x, center.y + line);
      lineCount++;
      ctxVirtualCamera.fillStyle = 'red';
      ctxVirtualCamera.fillText(nickname, center.x, center.y + (line * lineCount));
      ctxVirtualCamera.fillStyle = '#fff';
      if (nickname) {
        ctxVirtualCamera.font = `bold ${pulseEffect.fontSize}px sans-serif`;
        lineCount++;
        ctxVirtualCamera.fillText('Press enter to continue', center.x, center.y + (line * lineCount));
      }
    }
    else if (actualStatus === STATUS.CHOOSE_PERSON) {
      ctxVirtualCamera.font = `bold ${pulseEffect.maxFontSize}px sans-serif`;
      ctxVirtualCamera.fillText('Select your character', center.x, center.y + line);
      Object.entries(SKINS).forEach(([key, value]) => {
        lineCount++;
        const X = center.x;
        const Y = center.y + (line * lineCount);
        // if mouse is over the button increase a font size
        if (
          mouse.x > X - (value.length * 10) && mouse.x < X + (value.length * 10) &&
          mouse.y > Y - lineHeight / 2 && mouse.y < Y + lineHeight / 2 || selectedSkin === value
        ) {
          ctxVirtualCamera.fillStyle = 'red';
          ctxVirtualCamera.font = `bold ${pulseEffect.maxFontSize}px sans-serif`;
          selectedSkin = value;
        } else {
          ctxVirtualCamera.fillStyle = '#fff';
          ctxVirtualCamera.font = `bold ${pulseEffect.minFontSize}px sans-serif`;
        }
        ctxVirtualCamera.fillText(value, X, Y);
      });

      lineCount++;
      ctxVirtualCamera.font = `bold ${pulseEffect.fontSize}px sans-serif`;
      ctxVirtualCamera.fillStyle = '#fff';
      ctxVirtualCamera.fillText('Press enter to continue', center.x, center.y + (line * lineCount));
    }
    else if (actualStatus === STATUS.CONNECTING) {
      ctxVirtualCamera.font = `bold ${pulseEffect.maxFontSize}px sans-serif`;
      ctxVirtualCamera.fillText('Connecting...', center.x, center.y + 32 + 16);
    }
    else if (actualStatus === STATUS.ERROR) {
      ctxVirtualCamera.font = `bold ${pulseEffect.maxFontSize}px sans-serif`;
      ctxVirtualCamera.fillText('Error when try connect with websocket', center.x, center.y + 32 + 16);
      ctxVirtualCamera.fillText('Press any key to try again', center.x, center.y + 32 + 16 + 32);
    }
  }

  function tick() {
    update();
    render();
  }

  function menuLoop(time) {
    const delta = time - lastTime;
    if (delta > interval) {
      lastTime = time - (delta % interval);
      tick();
    }
    frameAnimation = requestAnimationFrame(menuLoop); // menu loop
  }
  frameAnimation = requestAnimationFrame(menuLoop); // menu loop

  function initKeyListeneer() {
    const boundingClientRect = canvasVirtualCamera.getBoundingClientRect();

    function callInitGame() {
      if (nickname) {
        actualStatus = STATUS.CONNECTING;
        on('ws', (event) => {
          const { type, data, previousPlayers } = event.detail;
          if (type === 'success') {
            off('keydown', keyListener);
            off('keydown', mouseListener);
            cancelAnimationFrame(frameAnimation);
            initGame(data, previousPlayers);
          } else {
            actualStatus = STATUS.ERROR;
          }
        }, { once: true });

        window.ws.send('join', {
          name: Object.entries(SKINS).find(([, v]) => v === selectedSkin)[0],
          nickname
        })
      }
    }

    function keyListener(event) {
      if (actualStatus === STATUS.INIT) {
        actualStatus = STATUS.REQUEST_NICK;
      }
      else if (actualStatus === STATUS.REQUEST_NICK) {
        if (event.key === 'Backspace') {
          nickname = nickname.substring(0, nickname.length - 1);
        }
        else if (event.key === 'Enter') {
          actualStatus = STATUS.CHOOSE_PERSON;
        }
        else if (/^([a-zA-Z0-9_]{1})$/.test(event.key) && nickname.length < 16) {
          nickname += event.key;
        }

      }
      else if (actualStatus === STATUS.CHOOSE_PERSON) {
        if (event.key === 'Enter') {
          callInitGame();
        }
        else if (event.key === 'ArrowDown') {
          let actualIndex = Object.values(SKINS).indexOf(selectedSkin);
          selectedSkin = Object.values(SKINS)[actualIndex + 1] ?? Object.values(SKINS).at(-1);
        }
        else if (event.key === 'ArrowUp') {
          let actualIndex = Object.values(SKINS).indexOf(selectedSkin);
          selectedSkin = Object.values(SKINS)[actualIndex - 1] ?? Object.values(SKINS).at(0);
        } else if (event.key === 'Escape') {
          actualStatus = STATUS.REQUEST_NICK;
        }

      }
      if (actualStatus === STATUS.ERROR) {
        actualStatus = STATUS.REQUEST_NICK;
      }

    }
    function mouseListener(event) {
      mouse.x = event.clientX - boundingClientRect.left;
      mouse.y = event.clientY - boundingClientRect.top;
    }
    on('keydown', keyListener);
    on('mousemove', mouseListener);
  }
  initKeyListeneer();
}

function game(props) {
  const { sprites, self, previousPlayers } = props;
  let FPS = 30;
  let interval = 1000 / FPS;
  let lastTime = 0;
  let frameAnimation = 0;

  const mapImageElement = sprites.mapSrc;
  const virtualCamera = {
    x: 0,
    y: 0,
    width: canvasVirtualCamera.width,
    height: canvasVirtualCamera.height,
  }

  const canvasMap = document.createElement('canvas');
  canvasMap.width = mapImageElement.naturalWidth;
  canvasMap.height = mapImageElement.naturalHeight;
  const ctxMap = canvasMap.getContext('2d');

  const player = new Player(self, canvasMap);
  const players = new Map([
    [self.id, player],
    ...previousPlayers.map(otherPlayer => [otherPlayer.id, new Player(otherPlayer, canvasMap)])
  ]);

  function update() {
    player.setOffset(virtualCamera.x, virtualCamera.y);
    players.forEach(player => player.tick());
  }

  function renderVirtualCamera() {
    const offsetX = player.position.x - virtualCamera.width / 2;
    const offsetY = player.position.y - virtualCamera.height / 2;

    if (offsetX < 0) virtualCamera.x = 0;
    else if (offsetX > mapImageElement.naturalWidth - virtualCamera.width) virtualCamera.x = mapImageElement.naturalWidth - virtualCamera.width;
    else virtualCamera.x = offsetX;

    if (offsetY < 0) virtualCamera.y = 0;
    else if (offsetY > mapImageElement.naturalHeight - virtualCamera.height) virtualCamera.y = mapImageElement.naturalHeight - virtualCamera.height;
    else virtualCamera.y = offsetY;

    ctxVirtualCamera.drawImage(
      canvasMap,
      virtualCamera.x,
      virtualCamera.y,
      canvasVirtualCamera.width,
      canvasVirtualCamera.height,
      0,
      0,
      virtualCamera.width,
      virtualCamera.height,
    ); // draw the background image
  }

  function renderMap() {
    ctxMap.drawImage(sprites.mapSrc, 0, 0);
  }
  function render() {
    ctxVirtualCamera.clearRect(0, 0, canvasVirtualCamera.width, canvasVirtualCamera.height);
    ctxMap.clearRect(0, 0, canvasMap.width, canvasMap.height);
    renderMap();

    players.forEach(player => player.render());

    // ctx.drawImage(canvasRender, 0, 0)
    renderVirtualCamera();

  }

  function tick() {
    update();
    render();
  }

  function onGame(time) {
    const delta = time - lastTime;
    if (delta > interval) {
      lastTime = time - (delta % interval);
      tick();
    }
    frameAnimation = requestAnimationFrame(onGame); // game loop
  }
  frameAnimation = requestAnimationFrame(onGame);

  on('ws', (event) => {
    const { data, type } = event.detail;
    switch (type) {
      case 'update':
        data.forEach(playerUpdateData => {
          players.get(playerUpdateData.id).updateWS(playerUpdateData);
        })
        break;
      case 'newPlayer':
        players.set(data.id, new Player({ ...data, controller: false }, canvasMap));
        break;
      case 'disconnect':
        data.id && players.delete(data.id);
        break;
      case 'syncMove':
        player.syncMove(data);
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

async function init() {
  const sprites = await loadSprites();
  const STATES = {
    MENU: 0,
    GAME: 1,
  };
  let initialGameData = {};
  const state = new Proxy({ current: STATES.MENU }, {
    set: (target, prop, value) => {
      target[prop] = value;
      if (value === STATES.GAME) {
        //init game
        game(initialGameData);
        on('keypress', keyListener);

      } else if (value === STATES.MENU) {
        //goback to menu
        menu(
          { bg: sprites.menuBg },
          (self, previousPlayers) => {
            initialGameData = {
              sprites: {
                mapSrc: sprites.mapSrc
              },
              self,
              previousPlayers
            };
            state.current = STATES.GAME;
          }
        );
        off('keypress', keyListener);
      }
      return true;
    }
  })

  state.current = STATES.MENU;

  function keyListener({ key }) {
    //case press esc goback to menu
    if (key === 'Escape') {
      if (state.current === STATES.GAME) {
        state.current = STATES.MENU;
      }
    }
  }
}


(function instanceWebsocket() {
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
    init();
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
})();