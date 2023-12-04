const port = '8080';
let ws = new WebSocket("ws://" + window.location.hostname + ":" + port + "/gamews");



ws.onopen = function() {
    console.log('hi');
}





ws.onmessage = function(msgevent) {
    console.log(msgevent.data);
}

ws.onclose = function() {
    console.log("closed");
}

