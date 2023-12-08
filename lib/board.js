const boardSize = 10;

const fieldStates = {
    UNKNOWN: 0,
    WATER: 1,
    SHIP: 2,
    DESTROYED: 3
};
module.exports.fieldStates = fieldStates;

const maxShipCount = [0,0,1,2,1,1];
const maxTotalShipCount = maxShipCount.reduce((a,b) => a+b);
const maxShipLength = 5;
const minShipLength = 2;

class Board {
    board;
    bombs;
    shipCount;
    totalShipCount;
    constructor() {
        this.board = new Array(boardSize);
        for (let i = 0; i < boardSize; i++) {
            this.board[i] = new Array(boardSize).fill( null );
        }

        this.bombs = new Array(boardSize);
        for (let i = 0; i < boardSize; i++) {
            this.bombs[i] = new Array(boardSize).fill( false );
        }

        this.shipCount = new Array(maxShipLength+1).fill(0);

        this.totalShipCount = maxTotalShipCount;
    }

    getAvailableSizes() {
        let available = new Array(this.shipCount.length).fill(false);
        for (let i in available) {
            if (this.shipCount[i] < maxShipCount[i]) {
                available[i] = true;
            }
        }
        return available;
    }

    allShipsPlaced() {
        let result = true;
        for (let i in this.shipCount) {
            if (this.shipCount[i] < maxShipCount[i]) {
                result = false;
            }
        }
        return result;
    }

    validateShip(x,y,size,hor) {
        if (x < 0 || x >= boardSize || y < 0 || y >= boardSize || size < minShipLength || size > maxShipLength) {
            return false;
        }

        if (hor) {
            for (let k = y; k < y + size; k++) {
                if (k === boardSize || this.board[x][k]) {
                    return false;
                }
            }
        } else {
            for (let k = x; k < x + size; k++) {
                if (k === boardSize || this.board[k][y]) {
                    return false;
                }
            }
        }
        return this.shipCount[size] < maxShipCount[size];
    }

    placeShip(x,y,size,hor) {
        let ship = {x: x, y: y, size: size, hor: hor, damage: 0}
        if (hor) {
            for (let k = y; k < y + size; k++) {
                this.board[x][k] = ship;
            }
        } else {
            for (let k = x; k < x + size; k++) {
                this.board[k][y] = ship;
            }
        }
        this.shipCount[size]++;
    }

    validAttack(x, y) {
        if (x < 0 || y < 0 || x >= boardSize || y >= boardSize) {
            return false;
        }
        return this.bombs[x][y] === false;
    }

    attack(x, y) {
        this.bombs[x][y] = true;
        if (this.board[x][y]) {
            let ship = this.board[x][y];
            ship.damage++;
            if (ship.size === ship.damage) {
                this.totalShipCount--;
                return {x: ship.x, y: ship.y, shipsize: ship.size, hor: ship.hor};
            }
        }
        return null;
    }

    getState(x, y) {
        if (this.board[x][y] === null) {
            return fieldStates.WATER;
        }
        return fieldStates.SHIP;
    }

    allShipsDestroyed() {
        return this.totalShipCount === 0;
    }
}

module.exports.Board = Board;
module.exports.maxTotalShipCount = maxTotalShipCount;