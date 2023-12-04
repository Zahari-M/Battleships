const {Board} = require('./board.js');
const {playerStatus} = require('./player.js');

class Game {
    players;
    boards;
    constructor() {
        this.players = [];
        this.boards = [new Board(), new Board()];
    }

    addPlayer(player) {
        this.players.push(player);
    }

    start() {
        this.players.forEach((player) => player.status = playerStatus.PLACING);
        for(let i = 0; i < 2; i++) {
            let obj = this.#getPlacingJSON(i);
            obj.enemy = players[1-i].name;
            players[i].ws.send( JSON.stringify(obj) );
        }
    }

    #getPlacingJSON(number) {
        let obj = {};
        obj.status = this.players[number].status;
        obj.board = this.boards[i].getBoardJSON();
        obj.availableSizes = this.boards[i].getAvailableSizes();
        return obj;
    }
}

module.exports.Game = Game;