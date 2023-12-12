const {Board, maxTotalShipCount} = require('./board.js');
const {playerStatus} = require('./player.js');
const db = require('../db.js');

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
            let obj = {status: playerStatus.PLACING};
            obj.enemyName = this.players[this.#other(i)].name;
            this.players[i].ws.send( JSON.stringify(obj) );
        }
    }

    close(playerNumber) {
        if (this.players[playerNumber].status === playerStatus.DISCONNECTED) {
            return;
        }

        this.players[playerNumber].status = playerStatus.DISCONNECTED;
        this.players[playerNumber].ws.close();
        this.close(this.#other(playerNumber));
    }

    move(playerNumber, obj) {
        if (this.players[playerNumber].status === playerStatus.PLACING) {
            let {x, y, shipsize, hor} = obj;
            
            if (!(typeof x == 'number' && typeof y == 'number' && typeof shipsize == 'number' && typeof hor == 'boolean' )) {
                return;
            }
            if (this.boards[playerNumber].validateShip(x,y,shipsize,hor)) {
                this.boards[playerNumber].placeShip(x,y,shipsize,hor);

                if (this.boards[playerNumber].allShipsPlaced()) {
                    let btns = this.boards[playerNumber].getAvailableSizes();
                    this.players[playerNumber].status = playerStatus.READY;
                    this.players[playerNumber].ws.send(JSON.stringify({ship: {x, y, shipsize, hor},
                        status: playerStatus.READY, activebuttons: btns}));
                    
                    // start second phase
                    if (this.players[this.#other(playerNumber)].status === playerStatus.READY) {
                        let attacking = Math.floor(2*Math.random());
                        this.players[attacking].status = playerStatus.ATTACKING;
                        this.players[attacking].ws.send(JSON.stringify({status: playerStatus.ATTACKING, 
                            maxshipcount: maxTotalShipCount}));
                        
                        let idle = this.#other(attacking);
                        
                        this.players[idle].status = playerStatus.IDLE;
                        this.players[idle].ws.send(JSON.stringify({status: playerStatus.IDLE, 
                            maxshipcount: maxTotalShipCount}));
                    }
                } else {
                    let btns = this.boards[playerNumber].getAvailableSizes();
                    this.players[playerNumber].ws.send(JSON.stringify({ship: {x, y, shipsize, hor},
                        status: playerStatus.PLACING, activebuttons: btns})); 
                }
            }
        } else if (this.players[playerNumber].status === playerStatus.ATTACKING) {
            let {x, y} = obj;
            if (!(typeof x === 'number' && typeof y === 'number')) {
                return;
            }
            let other = this.#other(playerNumber);
            if (!this.boards[other].validAttack(x,y)) {
                return;
            }
            let destroyedship = this.boards[other].attack(x,y);
            let fieldstate = this.boards[other].getState(x, y);
            this.players[playerNumber].status = playerStatus.IDLE;
            this.players[playerNumber].ws.send(JSON.stringify({status: playerStatus.IDLE, fieldstate, 
                destroyedship, bomb: {x, y}}));
            
            this.players[other].status = playerStatus.ATTACKING;
            this.players[other].ws.send(JSON.stringify({status: playerStatus.ATTACKING, destroyedship,
                bomb: {x,y}}));

            // finish game
            if(this.boards[other].allShipsDestroyed()) {
                this.players[playerNumber].status = playerStatus.WON;
                this.players[playerNumber].ws.send(JSON.stringify({status: playerStatus.WON}));
                db.addPoint(this.players[playerNumber].name);

                this.players[other].status = playerStatus.LOST;
                this.players[other].ws.send(JSON.stringify({status: playerStatus.LOST}));
            }
        }
    }

    #other(playerNumber) {
        return 1-playerNumber;
    }
}

module.exports.Game = Game;