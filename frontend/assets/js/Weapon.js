export default class Weapon {

  constructor({ weaponModel, x, y, canvasContext }) {
    this.weaponModel = new weaponModel();
    this.canvasContext = canvasContext;
    this.position = { x, y };

    this.side = 'right'; // right or left
    this.enable = false;


    this.debugger = {
      show_hitbox: false,
    }

    this.initController();
  }

  shoot() {
    console.log('shoot');
  }

  update() {
    console.log('update');
  }

  initController() {
    // define the side of the weapon based on the position of the weapon and the position of the mouse
    window.addEventListener('mousemove', (e) => {
      if (this.enable) {
        if (e.clientX > this.position.x) {
          this.side = 'right';
        } else {
          this.side = 'left';
        }
      }
    });

    window.addEventListener('keypress', (e) => {
      if (e.key === 'h') {
        this.debugger.show_hitbox = !this.debugger.show_hitbox;
      }
    });
  }

  render() {
    if (!this.weaponModel.image[this.side]) return;
    const weaponImage = this.weaponModel.image[this.side];
    this.canvasContext.save();
    this.canvasContext.translate(0, weaponImage.height / 2);
    this.canvasContext.drawImage(this.weaponModel.image[this.side].src, this.position.x, this.position.y);

    if (this.debugger.show_hitbox) {
      this.canvasContext.lineWidth = 2;
      this.canvasContext.strokeRect(this.position.x, this.position.y, weaponImage.width, weaponImage.height);
    }

    this.canvasContext.restore();
  }

  checkCollision({ x, y, width, height }){
    return this.weaponModel.checkCollision({ x, y, width, height }, this.position);
  }

  getCollisionBox(){
    console.log('getCollisionBox', this.weaponModel);
    return this.weaponModel.getCollisionBox(this.position);
  }


  // checkCollision({ x, y, width, height }) {
  //   return (
  //     (
  //       this.position.x < x + width ||
  //       this.position.x + weaponImage.width > x
  //     ) &&
  //     (
  //       this.position.y > y + height &&
  //       this.position.y + weaponImage.height < y
  //     )
  //   );
  // }
}