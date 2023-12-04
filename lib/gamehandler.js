const { Game } = require('./game.js');
const { Player, playerStatus} = require('./player.js');

let pendingGame = null;

module.exports = function(ws, req) {
    // todo: check req.user
    let currentGame, playerNumber;

    if (pendingGame !== null) {
        if (req.user.username === pendingGame.players[0].name) { //check player plays with himself
            ws.close();
            return;
        }
        currentGame = pendingGame;
        pendingGame = null;
        playerNumber = 1;
    } else {
        playerNumber = 0;
        currentGame = pendingGame = new Game();
    }

    currentGame.addPlayer(new Player(playerStatus.PENDING, ws, req.user.username));
    if(pendingGame === null) {
        currentGame.start();
    }

    ws.on('message', function(msg) {
        console.log(msg);
        ws.send(msg);
    });

    ws.on('close', function() {
        
    });
}