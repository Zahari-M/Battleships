const port = '8080';
let ws = new WebSocket("ws://" + window.location.hostname + ":" + port + "/gamews");

const gameMessage = document.getElementById('gamemessage');
const container = document.getElementById('container');
const playerStatus = {
    DISCONNECTED: 0,
    PENDING: 1,
    PLACING: 2,
    READY: 3,
    ATTACKING: 4,
    IDLE: 5,
    WON: 6,
    LOST: 7
};
const fieldStates = {
    UNKNOWN: 0,
    WATER: 1,
    SHIP: 2,
    DESTROYED: 3
};
const boardSize = 10;
const maxShipLength = 5;
const minShipLength = 2;
let currentStatus = playerStatus.DISCONNECTED;
let enemyName = "";
let playerShipCount = null;
let enemyShipCount = null;
let placementUI = null;
let gameUI = null;
let disabled = false;

function clearUI() {
    container.textContent = "";
    placementUI = null;
    gameUI = null;
}

function setMessage() {
    switch(currentStatus) {
        case playerStatus.PLACING:
            gameMessage.textContent = "Place your ships.";
            break;
        case playerStatus.READY:
            gameMessage.textContent = "Waiting " + enemyName + ".";
            break;
        case playerStatus.ATTACKING:
            gameMessage.textContent = "It's your turn.";
            break;
        case playerStatus.IDLE:
            gameMessage.textContent = "It's " + enemyName + "'s turn.";
            break;
    }
}

class Board {
    root;
    fields;
    representation;
    bombs;
    constructor(repr) {
        this.representation = repr;
        this.root = document.createElement('div');
        this.root.className = 'board';
        this.fields = new Array(boardSize);
        for (let i=0; i<boardSize; i++) {
            this.fields[i] = new Array(boardSize);
            for (let j=0; j<boardSize; j++) {
                this.fields[i][j] = document.createElement('div');
                this.root.appendChild( this.fields[i][j]);
            }
        }

        this.bombs = new Array(boardSize);
        for (let i=0; i<boardSize; i++) {
            this.bombs[i] = new Array(boardSize);
            for (let j=0; j<boardSize; j++) {
                this.bombs[i][j] = false;
            }
        }

        this.drawBoard();
    }

    drawBoard() {
        for(let i in this.fields) {
            for (let j in this.fields[i]) {
                this.draw(i,j);
            }
        }
    }

    draw(i, j) {
        let classname = ''
        switch (this.representation[i][j]) {
            case fieldStates.UNKNOWN:
                classname = 'unknown';
                break;
            case fieldStates.WATER:
                classname = 'water';
                break;
            case fieldStates.SHIP:
                classname = 'ship';
                break;
            case fieldStates.DESTROYED:
                classname = 'destroyed';
                break; 
        }
        this.fields[i][j].className = classname;
    }

    setBomb(x, y) {
        this.bombs[x][y] = true;
        this.fields[x][y].textContent = '\u{1F4A3}';
    }

    setField(x, y, status) {
        this.representation[x][y] = status;
        this.draw(x, y);
    }

    destroyShip(ship) {
        let {x,y,shipsize,hor} = ship;
        if (hor) {
            for (let k = y; k < y + shipsize; k++) {
                this.representation[x][k] = fieldStates.DESTROYED;
                this.draw(x, k);
            }
        } else {
            for (let k = x; k < x + shipsize; k++) {
                this.representation[k][y] = fieldStates.DESTROYED;
                this.draw(k, y);
            }
        }
    }
}

class PlacementBoard extends Board {
    ship = null;
    constructor(repr) {
        super(repr);
        for(let i in this.fields) {
            for (let j in this.fields[i]) {
                this.fields[i][j].onclick = () => {
                    if (disabled || !this.ship) {
                        return;
                    }
                    
                    if (this.#validate(i,j)) {
                        ws.send(JSON.stringify({x: +i, y: +j,
                            shipsize: this.ship.size, hor: this.ship.hor}));
                        disabled = true;
                        this.ship = null;
                        this.#clearHover();
                    }
                }; 

                this.fields[i][j].onmouseenter = () => {
                    if (this.ship === null) {
                        return;
                    }
                    this.#clearHover();
                    let hoverclass = 'redhover';
                    if (this.#validate(i,j)) {
                        hoverclass = 'greenhover';
                    }
                    this.#drawHover(i,j,hoverclass);
                }
            }
        }
        this.root.onmouseleave = () => {
            this.#clearHover();
        }
    }

    addShip(ship) {
        let {x,y,shipsize,hor} = ship;
        if (hor) {
            for (let k = y; k < y + shipsize; k++) {
                this.representation[x][k] = fieldStates.SHIP;
            }
        } else {
            for (let k = x; k < x + shipsize; k++) {
                this.representation[k][y] = fieldStates.SHIP;
            }
        }
    }

    #clearHover() {
        for(let i in this.fields) {
            for (let j in this.fields[i]) {
                this.fields[i][j].classList.remove('greenhover','redhover');
            }
        }
    }

    #drawHover(i, j, hoverclass) {
        i = +i;
        j = +j;
        if (this.ship.hor) {
            for (let k = j; (k < (j + this.ship.size)) && (k < boardSize); k++) {
                this.fields[i][k].classList.add(hoverclass);
            }
        } else {
            for (let k = i; (k < (i + this.ship.size)) && (k < boardSize); k++) {
                this.fields[k][j].classList.add(hoverclass);
            }
        }
    }

    #validate(i, j) {
        i = +i;
        j = +j;
        if (this.ship === null) {
            return false;
        }
        
        if (this.ship.hor) {
            for (let k = j; k < j + this.ship.size; k++) {
                if (k === boardSize || this.representation[i][k] !== fieldStates.WATER) {
                    return false;
                }
            }
        } else {
            for (let k = i; k < i + this.ship.size; k++) {
                if (k === boardSize || this.representation[k][j] !== fieldStates.WATER) {
                    return false;
                }
            }
        }
        return true;
    }
}

class PlacementUI {
    placementBoard;
    enabledButtons;
    buttons;
    #hor = true;
    #shipsize = 2;
    constructor() {
        let repr = new Array(boardSize);
        for(let i = 0; i < boardSize; i++) {
            repr[i] = new Array(boardSize).fill(fieldStates.WATER);
        }
        this.placementBoard = new PlacementBoard(repr);
        this.placementBoard.drawBoard();
        let placementUIdiv = document.createElement('div');
        placementUIdiv.className = 'placementUI';
        placementUIdiv.appendChild(this.placementBoard.root);
        container.appendChild(placementUIdiv);

        // buttons
        this.enabledButtons = new Array(maxShipLength+1).fill(true);
        this.buttons = new Array(maxShipLength+1);
        let buttonConatiner = document.createElement('div');
        buttonConatiner.className = 'buttonContainer';
        for (let i = 2; i <= maxShipLength; i++) {
            let button = document.createElement('button');
            this.buttons[i] = button;
            button.className = 'normalbutton pointer';
            button.innerText = i;
            button.onclick = () => {
                if (!this.enabledButtons[i] || disabled) {
                    return;
                }
                this.#shipsize = i;
                this.#setShip();
            };
            buttonConatiner.appendChild(button);
        }
        let rotate = document.createElement('button');
        rotate.className = 'normalbutton pointer';
        rotate.innerText = '↺';
        rotate.onclick = () => {
            if(disabled || !this.enabledButtons[this.#shipsize]) {
                return;
            }
            this.#hor = !this.#hor;
            this.#setShip();
        };
        buttonConatiner.appendChild(rotate);
        placementUIdiv.appendChild(buttonConatiner);
    }

    updateUI() {
        this.placementBoard.drawBoard();
        for (let i = minShipLength; i <= maxShipLength; i++) {
            if (this.enabledButtons[i]) {
                this.buttons[i].className = "normalbutton pointer";
            } else {
                this.buttons[i].className = "normalbutton inactivebutton";
            }
        }
    }

    #setShip() {
        this.placementBoard.ship = {size: this.#shipsize, hor: this.#hor};
    }

    #unsetShip() {
        this.placementBoard.ship = null;
    }
}

class EnemyBoard extends Board {
    constructor() {
        let repr = new Array(boardSize);
        for(let i = 0; i < boardSize; i++) {
            repr[i] = new Array(boardSize).fill(fieldStates.UNKNOWN);
        }
        super(repr);

        for(let i in this.fields) {
            for (let j in this.fields[i]) {
                this.fields[i][j].onclick = () => {
                    if (this.representation[i][j] != fieldStates.UNKNOWN || disabled) {
                        return;
                    }
                    ws.send(JSON.stringify({x: +i, y: +j}));
                    disabled = true;
                    this.unsetPointer();
                    // TODO: send to server
                }
            }
        }
    }

    setPointer() {
        for(let i in this.representation) {
            for (let j in this.representation[i]) {
                if (this.representation[i][j] === fieldStates.UNKNOWN) {
                    this.fields[i][j].classList.add('pointer');
                }
            }
        }
    }

    unsetPointer() {
        for(let i in this.representation) {
            for (let j in this.representation[i]) {
                this.fields[i][j].classList.remove('pointer');
            }
        }
    }
}

class GameUI {
    playerBoard;
    enemyBoard;
    playerMessage;
    enemyMessage;
    constructor(oldrepr) {
        this.playerBoard = new Board(oldrepr);
        this.enemyBoard = new EnemyBoard();

        this.playerMessage = document.createElement('div');
        this.enemyMessage = document.createElement('div');
        this.playerMessage.className = this.enemyMessage.className = 'boardinfo';
        this.setPlayerMessage();
        this.setEnemyMessage();

        let gameContainer = document.createElement('div');
        gameContainer.className = 'gamecontainer';
        gameContainer.append(this.playerBoard.root, this.enemyBoard.root, this.playerMessage, this.enemyMessage);
        container.append(gameContainer);
    }

    setPlayerMessage() {
        this.playerMessage.textContent = 'You have ' + playerShipCount + ' ships left.';
    }

    setEnemyMessage() {
        this.enemyMessage.textContent = enemyName + ' has ' + enemyShipCount + ' ships left.';
    }
}

ws.onopen = function() {
    currentStatus = playerStatus.PENDING;
    console.log('hi');
}

ws.onmessage = function(msgevent) {
    let msg = JSON.parse( msgevent.data );
    console.log(msg);
    if (msg.status === playerStatus.PLACING) {
        if(currentStatus === playerStatus.PENDING) {
            gameMessage.textContent = "Place your ships";
            placementUI = new PlacementUI();
            enemyName = msg.enemyName;
            currentStatus = playerStatus.PLACING;
            return;
        }
        placementUI.enabledButtons = msg.activebuttons;
        placementUI.placementBoard.addShip(msg.ship);
        placementUI.updateUI();
        disabled = false;
    } else if (msg.status === playerStatus.READY) {
        currentStatus = playerStatus.READY;
        placementUI.enabledButtons = msg.activebuttons;
        placementUI.placementBoard.addShip(msg.ship);
        placementUI.updateUI();
        gameMessage.textContent = "Waiting " + enemyName;
    } else if (msg.status === playerStatus.ATTACKING || msg.status === playerStatus.IDLE) {
        if (currentStatus === playerStatus.READY) {
            
            let oldrepr = placementUI.placementBoard.representation;
            clearUI();
            playerShipCount = enemyShipCount = msg.maxshipcount;
            gameUI = new GameUI(oldrepr);
            
            currentStatus = msg.status;
            if (msg.status === playerStatus.ATTACKING) {
                disabled = false;
                gameUI.enemyBoard.setPointer();
            }
            setMessage();
            return;
        }
        
        if (currentStatus === playerStatus.ATTACKING) {
            let {x,y} = msg.bomb;
            gameUI.enemyBoard.setField(x, y, msg.fieldstate);
            gameUI.enemyBoard.setBomb(x, y);
            if (msg.destroyedship) {
                gameUI.enemyBoard.destroyShip(msg.destroyedship);
                enemyShipCount--;
                gameUI.setEnemyMessage();
            }
        } else {
            let {x,y} = msg.bomb;
            gameUI.playerBoard.setBomb(x, y);
            if (msg.destroyedship) {
                gameUI.playerBoard.destroyShip(msg.destroyedship);
                playerShipCount--;
                gameUI.setPlayerMessage();
            }
            disabled = false;
            gameUI.enemyBoard.setPointer();
        }
        currentStatus = msg.status;
        setMessage();
    }
}

ws.onclose = function() {
    clearUI();
    gameMessage.textContent = "A player disconnected.";
}

