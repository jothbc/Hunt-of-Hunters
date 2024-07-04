export default class CollisionBox{

  constructor(width, height) {
    this.collisionBox = { width, height };
  }

  updateCollisionBox(width, height) {
    this.collisionBox.width = width;
    this.collisionBox.height = height;
  }

  checkCollision({ x, y, width, height }, position) {
    return (
      (
        position.x < x + width ||
        position.x + this.collisionBox.width > x
      ) &&
      (
        position.y > y + height &&
        position.y + this.collisionBox.height < y
      )
    );
  }
  getCollisionBox(position){
    return {
      x: position.x,
      y: position.y,
      width: this.collisionBox.width,
      height: this.collisionBox.height,
    };
  }
}