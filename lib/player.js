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

class Player {
    status;
    ws;
    name;
    constructor(status, ws, name) {
        this.status = status;
        this.ws = ws;
        this.name = name;
    }
}

module.exports.Player = Player;
module.exports.playerStatus = playerStatus;