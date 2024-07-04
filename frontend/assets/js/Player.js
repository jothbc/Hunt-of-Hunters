import Ak_Weapon from "./weapons/Ak.js";

class Player {

  constructor(props, canvas) {
    this.id = props.id;
    this.name = props.name;
    this.nickname = props.nickname;
    this.health = props.health;
    this.points = props.points;
    this.position = {
      x: props.position.x,
      y: props.position.y,
      speed: props.position.speed,
      angle: props.position.angle,
      side: props.position.side,
    };
    this.keys = {};
    this.mouse = {
      x: 0,
      y: 0,
      offsetX: 0,
      offsetY: 0,
    }
    this.canvas = canvas;
    this.renderContext = this.canvas.getContext('2d');
    this.sprite = {
      left: {},
      right: {},
      frame: 0,
    };
    this.weapon = new Ak_Weapon({ position: this.position }, props.controller, this.renderContext);
    // this.bullets = [];
    this.debugger = {
      show_hitbox: false,
    }
    this.controller = props.controller;

    this.loadSprite();
    if (this.controller) {
      this.initController();
    }
  }

  loadSprite() {
    const sprites = ['right', 'left'];
    sprites.forEach((sideSprite) => {
      const side = new Image();
      side.onload = () => {
        const width = side.naturalWidth;
        const height = side.naturalHeight;
        this.sprite[sideSprite] = {
          image: side,
          width: height, //to keep it square
          height,
          frames: width / height
        };
      }
      side.src = `./assets/images/player/${this.name}/${sideSprite}.png`;
    });

  }
  initController() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX + this.mouse.offsetX;
      this.mouse.y = e.clientY + this.mouse.offsetY;
    });
  }

  isMouseAtRightSideAboutPlayerPosition() {
    return this.mouse.x > this.position.x;
  }

  getMouseAngle() {
    const mouseAngle = Math.atan2(this.mouse.y - this.position.y, this.mouse.x - this.position.x);
    return mouseAngle;
  }

  render() {
    if (!this.sprite.left.image || !this.sprite.right.image) return;

    const side = this.position.side;
    const transform = {
      x: -(this.sprite[side].width / 2),
      y: -(this.sprite[side].height / 2)
    }
    //render player
    {
      this.renderContext.save();
      this.renderContext.translate(
        transform.x,
        transform.y
      );

      this.renderContext.drawImage(
        this.sprite[side].image, // image
        ((this.sprite.frame % this.sprite[side].frames) * this.sprite[side].width), // offset x related to image
        0, // offset y related to image
        this.sprite[side].width, // width of image
        this.sprite[side].height, // height of image
        this.position.x, // x position on canvas
        this.position.y, // y position on canvas
        this.sprite[side].width, // width of image
        this.sprite[side].height, // height of image
      );

      if (window.debug_mode) {
        this.renderContext.strokeStyle = 'red';
        this.renderContext.lineWidth = 2;
        this.renderContext.strokeRect(this.position.x, this.position.y, this.sprite[side].width, this.sprite[side].height);
      }
      this.renderContext.restore();
    }

    // renderHealth
    {
      this.renderContext.fillStyle = 'red';
      this.renderContext.fillRect(this.position.x - 50, this.position.y + transform.y - 16, 100, 4);
      this.renderContext.fillStyle = 'green';
      this.renderContext.fillRect(this.position.x - 50, this.position.y + transform.y - 16, this.health, 4);
    }

    // renderPlayerName
    {
      this.renderContext.fillStyle = 'red';
      this.renderContext.textAlign = 'center';
      this.renderContext.textBaseline = 'middle';
      this.renderContext.font = 'bold 16px sans-serif';
      this.renderContext.fillText(this.nickname, this.position.x, this.position.y - 50);
    }



    if (window.debug_mode) {
      this.renderContext.beginPath();
      this.renderContext.lineWidth = 2;
      this.renderContext.strokeStyle = 'red';
      this.renderContext.arc(this.position.x, this.position.y, 100, 0, 2 * Math.PI);
      this.renderContext.stroke();

      this.renderContext.beginPath();
      this.renderContext.lineWidth = 2;
      this.renderContext.strokeStyle = 'blue';
      this.renderContext.arc(this.position.x, this.position.y, 5, 0, 2 * Math.PI);
      this.renderContext.stroke();
    }

    // render weapon
    if (this.weapon) this.weapon.render();


    // this.bullets.forEach((bullet) => {
    //   bullet.render();
    // });

  }

  move() {
    let prev = { ...this.position };
    if (this.keys['w'] && this.keys['d']) {
      this.position.x += this.position.speed * Math.cos(Math.PI / 4);
      this.position.y -= this.position.speed * Math.sin(Math.PI / 4);
    } else if (this.keys['w'] && this.keys['a']) {
      this.position.x -= this.position.speed * Math.cos(Math.PI / 4);
      this.position.y -= this.position.speed * Math.sin(Math.PI / 4);
    } else if (this.keys['s'] && this.keys['d']) {
      this.position.x += this.position.speed * Math.cos(Math.PI / 4);
      this.position.y += this.position.speed * Math.sin(Math.PI / 4);
    } else if (this.keys['s'] && this.keys['a']) {
      this.position.x -= this.position.speed * Math.cos(Math.PI / 4);
      this.position.y += this.position.speed * Math.sin(Math.PI / 4);
    } else if (this.keys['w']) {
      this.position.y -= this.position.speed;
    } else if (this.keys['s']) {
      this.position.y += this.position.speed;
    } else if (this.keys['a']) {
      this.position.x -= this.position.speed;
    } else if (this.keys['d']) {
      this.position.x += this.position.speed;
    }
    if (prev.x !== this.position.x || prev.y !== this.position.y) {
      window.ws.send('move', {
        position: {
          x: this.position.x,
          y: this.position.y,
        },
      });
    }
  }

  mouseMove() {
    let prev = { ...this.position };
    this.position.side = ['left', 'right'][Number(this.isMouseAtRightSideAboutPlayerPosition())];
    this.position.angle = this.getMouseAngle();
    if (prev.side !== this.position.side || prev.angle !== this.position.angle) {
      window.ws.send('mouse', {
        angle: this.position.angle,
        side: this.position.side,
      });
    }
  }

  syncMove(position) {
    this.position.x = position.x;
    this.position.y = position.y;
  }
 

  updateWS(props) {
    this.health = props.health;
    this.points = props.points;
    if (!this.controller) {
      this.position = {
        x: props.position.x,
        y: props.position.y,
        speed: props.position.speed,
        angle: props.position.angle,
        side: props.position.side,
      };
    }

  }

  setOffset(x,y){
    this.mouse.offsetX = x;
    this.mouse.offsetY = y;
  }

  tick() {
    if (this.controller) {
      this.move();
      this.mouseMove();
    }
    if (this.weapon) this.weapon.setPosition(this.position);
    this.sprite.frame++;
  }

  toWS() {
    return {
      id: this.id,
      nickname: this.nickname,
      position: {
        x: this.position.x,
        y: this.position.y,
        speed: this.position.speed,
        angle: this.position.angle,
        side: this.position.side,
      },
    }
  }
}

export default Player;