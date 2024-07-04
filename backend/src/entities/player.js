export default class Player {
  constructor(name, nickname, id, initialPosition = { x: 100, y: 100 }) {
    this.name = name;
    this.nickname = nickname;
    this.id = id;
    this.health = 100;
    this.points = 0;
    this.position = {
      x: initialPosition.x,
      y: initialPosition.y,
      speed: 5,
      angle: 0,
      side: 'right',
      size: 50
    };
  }
  update(props) {
    this.position.x = props.position.x;
    this.position.y = props.position.y;
    this.position.angle = props.position.angle;
    this.position.speed = props.position.speed;
    this.position.side = props.position.side;
  }

  getPosition() {
    return this.position;
  }

  toWS() {
    return {
      id: this.id,
      name: this.name,
      nickname: this.nickname,
      health: this.health,
      points: this.points,
      position: this.position,
    }
  }

  move({position}){
    let validMove = true;

    //check if the player is moving out of the canvas
    // if(position.x < 0 || position.x > 400 || position.y < 0 || position.y > 400){
    //   validMove = false;
    // }
    
    if(validMove){
      this.position.x = position.x;
      this.position.y = position.y;
    }

    return validMove;
  }
  mouse({angle, side}){
    this.position.angle = angle;
    this.position.side = side;
  }

  getSize(){
    return this.position.size;
  }
}