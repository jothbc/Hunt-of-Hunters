import WebSocket, { WebSocketServer } from 'ws';
import Player from './entities/player.js';
import Game from './game.js';
import { v4 } from 'uuid';

const wss = new WebSocketServer({ port: 3333 });

const game = new Game();

const FPS = 32;

const otherClients = (actualClient) => Array.from(wss.clients)
  .filter(clt => clt.readyState === WebSocket.OPEN)
  .filter(clt => clt.id !== actualClient.id)
const allClients = () => Array.from(wss.clients)
  .filter(clt => clt.readyState === WebSocket.OPEN);

const handleClientMove = (client, { position }) => {
  const currentTime = Date.now();
  const lastMove = client.lastMove || 0;
  if (client.player) {
    if (currentTime - lastMove > 1000 / FPS) {
      client.lastMove = currentTime;
      if(game.isFreeBlockPosition({ dx: position.x, dy: position.y }, client.player.getSize())) {
        client.player.move({ position });
      }else{
        client.send(JSON.stringify({
          type:'syncMove',
          data: client.player.getPosition()
        }));
        return;
      }

    } else {
      client.send(JSON.stringify({
        type: 'syncMove',
        data: client.player.getPosition()
      }));
    }
  }
}
const handleClientMouse = (client, { angle, side }) => {
  client.player.mouse({ angle, side });
}

const handleClientMessage = (client, message) => {
  const { type, data } = JSON.parse(message);
  switch (type) {
    case 'init':
      client.send(JSON.stringify({
        type: 'init',
        data: game.getConfis()
      }));
      return;
    case 'join':
      const previousPlayers = game.getPlayers().map((player) => player.toWS());
      client.player = new Player(data.name, data.nickname, client.id, game.getRandomFreeBlockPosition());
      game.addPlayer(client.player);
      client.send(JSON.stringify({
        type: 'success',
        data: {
          ...client.player.toWS(),
          controller: true,
        },
        previousPlayers,
      }));
      otherClients(client).forEach((clt) => {
        clt.send(JSON.stringify(
          {
            type: 'newPlayer',
            data: client.player.toWS()
          }
        ));
      });
      return;
    case 'move':
      handleClientMove(client, data);
      break;
    case 'mouse':
      handleClientMouse(client, data);
      break;
    default:
      break;
  }

  otherClients(client).forEach((clt) => {
    clt.send(JSON.stringify(
      {
        type: 'update',
        data: game.getPlayers().map((player) => player.toWS())
      }
    ));
  });
};

const handleDisconnectPlayer = (id) => {
  allClients().forEach((clt) => {
    clt.send(JSON.stringify(
      {
        type: 'disconnect',
        data: game.getPlayers().find((player) => player.id === id)
      }
    ));
  });
  game.removePlayer(id);
}

wss.on('connection', function connection(client) {
  client.id = v4();
  client.lastMove = Date.now();
  client.lastClick = Date.now();
  client.player = null;

  client.on('message', function incoming(message) {
    handleClientMessage(client, message);
  });

  client.on('error', function error(err) {
    console.log(err);
    handleDisconnectPlayer(client.id);
  });

  client.on('close', function error(err) {
    handleDisconnectPlayer(client.id);
  });

});

