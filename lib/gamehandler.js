const { Game } = require('./game.js');
const { Player, playerStatus} = require('./player.js');

let pendingGame = null;

module.exports = function(ws, req) {
    let currentGame, playerNumber;
    
    //debug
    //req.user = {username: 'test'};

    if (pendingGame) {
        if (req.user.username === pendingGame.players[0].name) { //check if player plays with himself
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
//    console.log(pendingGame, " ", currentGame);
    if(!pendingGame) {
        currentGame.start();
    }

    ws.on('message', function(msg) {
        currentGame.move(playerNumber, JSON.parse(msg));
    });

    ws.on('close', function() {
        if (pendingGame && pendingGame.players[0].ws === ws) {
            pendingGame = null;
            return; // no match
        }
        
        currentGame.close(playerNumber);
    });
}