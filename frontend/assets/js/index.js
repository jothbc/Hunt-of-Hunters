import Player from './Player.js';
import Weapon from './Weapon.js';
import Ak_Weapon from './weapons/Ak.js';


const fps = 30;
const interval = 1000 / fps;
let lastTime = 0;

const STATUS = {
  HOME: 0,
  GAME: 1,
  GAME_OVER: 2
}

const canvas = document.querySelector('#root');
const context = canvas.getContext('2d');


const players = [
  new Player({position: {x: 0, y: 0}, controller: true, canvasContext: context, name:"skull"}),
  new Player({position: {x: 300, y: 300}, controller: false, canvasContext: context, name:"skull"})
];
const dropItens = [];

function gameLoop(time) {
  const delta = time - lastTime;

  if (delta > interval) {
    lastTime = time - (delta % interval);
    update();
    render();
  }

  requestAnimationFrame(gameLoop);
}

function addRandomItemOnDropList(){
  const luckNumber = Math.floor(Math.random() * 1000);
  if(luckNumber < 10){
    
    const items = {
      weapon: 1,
      // health: 2,
      // shield: 3,
      // speed: 4,
      // damage: 5,
      // defense: 6,
    };
    const sortItem = Object.keys(items)[Math.floor(Math.random() * Object.keys(items).length)];
    const sortPosition = {
      x: Math.floor(Math.random() * canvas.width),
      y: Math.floor(Math.random() * canvas.height)
    }

    if(sortItem === 'weapon'){
      const weapons = {
        ak: Ak_Weapon
      };
      const sortWeapon = Object.keys(weapons)[Math.floor(Math.random() * Object.keys(weapons).length)];
      dropItens.push({
        position: sortPosition,
        item: new Weapon({
          weaponModel: weapons[sortWeapon], 
          x:sortPosition.x, 
          y: sortPosition.y,
          canvasContext: context
        })
      });
    }
  
  }
}

function update() {
  // Atualize a lógica do jogo aqui
  players.forEach(player=> player.sendToWS());

  addRandomItemOnDropList();

}

function render() {
  // limpa o render anterior do canvas
  (function clearScreen(){
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
  })();

  (function renderBorder(){
    context.lineWidth = 20; // (20px pois conta a partir do centro da linha, ou seja, 10px do lado esquerdo e direito)
    context.strokeStyle = 'red';
    context.strokeRect(0, 0, canvas.width, canvas.height);
  })();

  // renderiza o player
  (function renderPlayers() {
    players.forEach(player=> player.render());
  })();

  (function renderDropItens(){
    dropItens.forEach(dropItem => dropItem.item.render());
  })();

  (function checkCollision(){
    players.forEach(player => {
      dropItens.forEach(dropItem => {
        const model = dropItem.item;
        const collisionModel = model.getCollisionBox();
        if(player.checkCollision(collisionModel)){
          dropItens.splice(dropItens.indexOf(dropItem), 1);
        }
      })
    })
  })();
}

// inicia o canvas com o tamanho da janela
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Inicia o loop do jogo
requestAnimationFrame(gameLoop);








