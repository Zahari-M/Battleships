

module.exports = function(ws, req) {
    ws.send('123123123');
    ws.on('message', function(msg) {
        console.log(msg);
        ws.send(msg);
    });
}