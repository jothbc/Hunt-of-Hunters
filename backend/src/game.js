import Player from "./entities/player.js";

const BLOCKS = {
  INDESTRUCTIVE: 0,
  DESTRUCTIVE: 1,
  WALL: 2,
  FREE: 3
}

export default class Game {
  constructor() {
    this.players = new Map();
    this.width = 60;
    this.height = 30;
    this.blockSize = 50;

    this.map = this.generateMap(this.width, this.height);
  }

  generateMap(width, height) {
    const map = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
          row.push(BLOCKS.INDESTRUCTIVE);
        } else {
          const freeBlock = Math.random() < 0.8;
          if (freeBlock) {
            row.push(BLOCKS.FREE);
          } else {
            row.push(Math.random() < 0.5 ? BLOCKS.DESTRUCTIVE : BLOCKS.INDESTRUCTIVE);
          }
        }
      }
      map.push(row);
    }

    return map;
  }

  getConfis() {
    return {
      blockSize: this.blockSize,
      map: this.map,
    }
  }

  getRandomFreeBlockPosition() {
    const map = this.map;
    const width = this.width;
    const height = this.height;
    let x, y;
    do {
      x = Math.floor(Math.random() * width);
      y = Math.floor(Math.random() * height);
    } while (map[y][x] !== BLOCKS.FREE);
    return {
      x: x * this.blockSize,
      y: y * this.blockSize,
    };
  }


  isFreeBlockPosition({ dx, dy }, playerSize) {

    const playerBounds = {
      xCenter: dx,
      yCenter: dy,
      x1: dx - playerSize / 2,
      y1: dy - playerSize / 2,
      x2: dx + playerSize / 2,
      y2: dy + playerSize / 2,
    }

    const map = this.map;
    const width = this.width;
    const height = this.height;
    const blockSize = this.blockSize;

    const playerIsOutOfLimit = playerBounds.x1 < 0 || playerBounds.y1 < 0 || playerBounds.x2 > width * blockSize || playerBounds.y2 > height * blockSize;
    if (playerIsOutOfLimit) return false;

    const playerActualBlock = {
      x: Math.floor(playerBounds.xCenter / blockSize),
      y: Math.floor(playerBounds.yCenter / blockSize),
    }

    // console.log('map', this.map);
    // console.log('playerBounds', playerBounds);
    // console.log('playerActualBlock', playerActualBlock);



    return map[playerActualBlock.y][playerActualBlock.x] === BLOCKS.FREE;
  }

  addPlayer(player) {
    this.players.set(player.id, player);
    return player.toWS();
  }

  removePlayer(id) {
    this.players.delete(id);
  }

  getPlayers() {
    return Array.from(this.players, ([, v]) => v);
  }

}
