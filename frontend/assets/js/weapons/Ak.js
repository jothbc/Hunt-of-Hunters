import Bullet from "../Bullet.js";


const propsType = {
  x: 0,
  y: 0,
  angle: 0,
  side: 0
}

export default class Ak_Weapon {
  constructor(props = propsType, controller, canvasContext) {
    this.name = 'AK-47';
    this.ammo = 30;
    this.damage = 10;
    this.bullets = [];

    this.image = {
      left: {
        src: null,
        width: 0,
        height: 0,
        gunBarrelTip: {
          x: 0,
          y: 0,
        }
      },
      right: {
        src: null,
        width: 0,
        height: 0,
        gunBarrelTip: {
          x: 0,
          y: 0,
        }
      }
    };
    this.loadImage();
    this.canvasContext = canvasContext;
    this.controller = controller;

    this.position = {
      x: props.position.x,
      y: props.position.y,
      angle: props.position.angle,
      side: props.position.side
    }

    if (this.controller) {
      this.initController();
    }

  }

  initController() {
    window.addEventListener('click', () => {
      this.fire();
    })
  }

  fire() {
    if (this.ammo <= 0) {
      return;
    }
    const bullet = new Bullet({
      angle: this.position.angle,
      canvasContext: this.canvasContext,
      distanceTravelled: 0,
      position: {
        x: this.position.x,
        y: this.position.y
      },
      range: 100,
      speed: 10
    });
    this.bullets.push(bullet);
    this.ammo -= 1;
  }

  loadImage() {
    const sprites = ['right', 'left'];
    sprites.forEach((sideSprite) => {
      const img = new Image();
      img.src = `./assets/images/weapon/ak_${sideSprite}.png`;
      img.onload = () => {
        this.image[sideSprite] = {
          src: img,
          width: img.naturalWidth,
          height: img.naturalHeight,
          gunBarrelTip: {
            x: sideSprite === 'right' ? 50 : 0,
            y: 7,
          }
        };
      }
    });
  }

  render() {
    // render weapon
    this.canvasContext.save();

    this.canvasContext.translate(this.position.x, this.position.y);
    this.canvasContext.rotate(this.position.angle);

    this.canvasContext.drawImage(this.image[this.position.side].src, 0, - this.image[this.position.side].height / 2);

    // drawn a hitbox for debugging
    if (window.debug_mode) {
      this.canvasContext.beginPath();
      this.canvasContext.rect(0, - this.image[this.position.side].height / 2, this.image[this.position.side].width, this.image[this.position.side].height);
      this.canvasContext.lineWidth = 1;
      this.canvasContext.strokeStyle = 'red';
      this.canvasContext.stroke();
      this.canvasContext.closePath();
    }


    this.canvasContext.restore();

    this.bullets.forEach((bullet) => {
      bullet.render();
    })
  }

  update() {
    this.bullets.forEach((bullet) => {
      bullet.update();
    })
  }

  setPosition(position) {
    this.position.x = position.x;
    this.position.y = position.y;
    this.position.angle = position.angle;
    this.position.side = position.side;
  }
}