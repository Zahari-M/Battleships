const port = '8080';
let ws = new WebSocket("ws://" + window.location.hostname + ":" + port + "/gamews");

const gameMessage = document.getElementById('gamemessage');
const gameContainer = document.getElementById('container');
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

let currentStatus = playerStatus.DISCONNECTED;
let enemyName = "";

function clearUI() {
    gameContainer.textContent = "";
}
class Board {

}

class PlacementUI {

}

class GameUI {

}



ws.onopen = function() {
    currentStatus = playerStatus.PENDING;
}

ws.onmessage = function(msgevent) {
    let msg = JSON.parse( msgevent.data );
    if (msg.status == playerStatus.PLACING) {
        if(currentStatus == playerStatus.PENDING) {
            gameMessage.textContent = "Place your ships";
        }
    }
}

ws.onclose = function() {
    clearUI();
    gameMessage.textContent = "A player disconnected.";
}

