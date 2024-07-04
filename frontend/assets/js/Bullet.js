const initialProps = {
  position: {
    x: 0,
    y: 0,
  },
  angle: 0,
  speed: 10,
  range: 100,
  distanceTravelled: 0,
  canvasContext: null
}

class Bullet {
  constructor(props = initialProps) {
    this.position = props.position;
    this.angle = props.angle;
    this.speed = props.speed;
    this.range = props.range;
    this.distanceTravelled = props.distanceTravelled;
    this.canvasContext = props.canvasContext;
  }

  update(){
    this.position.x += this.speed * Math.cos(this.angle);
    this.position.y += this.speed * Math.sin(this.angle);
    this.distanceTravelled += this.speed;
  }

  render(){
    this.canvasContext.save();
    this.canvasContext.translate(this.position.x, this.position.y);
    this.canvasContext.rotate(this.angle);
    this.canvasContext.fillStyle = "green";
    this.canvasContext.fillRect(-5, -2.5, 10, 5); // Drawing a simple rectangle for bullet
    this.canvasContext.restore();
  }
}

export default Bullet;