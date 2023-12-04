const boardSize = 10;

const fieldStates = {
    UNKNOWN: 0,
    WATER: 1,
    SHIP: 2,
    DESTROYED: 3
};
module.exports.fieldStates = fieldStates;

const maxShipCount = [0,0,1,2,1,1];
const maxShipSize = 5;

class Board {
    board;
    bombs;
    shipCount;
    constructor() {
        this.board = new Array(boardSize);
        for (let i = 0; i < boardSize; i++) {
            this.board[i] = new Array(boardSize).fill( null );
        }

        this.bombs = new Array(boardSize);
        for (let i = 0; i < boardSize; i++) {
            this.bombs[i] = new Array(boardSize).fill( false );
        }

        this.shipCount = new Array(maxShipSize+1).fill(0);
    }

    getAvailableSizes() {
        let available = new Array(shipCount.length).fill(false);
        for (i in available) {
            if (this.shipCount[i] < maxShipCount[i]) {
                available[i] = true;
            }
        }
        return available;
    }

    allShipsPlaced() {
        let result = true;
        for (i in shipCount) {
            if (this.shipCount[i] < maxShipCount[i]) {
                result = false;
            }
        }
        return result;
    }

    getBoardJSON(enemy) {
        let presentation = new Array(boardSize);
        for (let i = 0; i < boardSize; i++) {
            presentation[i] = new Array(boardSize).fill( fieldStates.WATER );
        }

        if (enemy) {

        }
        return presentation;
    }
}

module.exports.Board = Board;