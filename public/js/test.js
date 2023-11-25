webSocket = new WebSocket("ws://localhost:8080/");

webSocket.onopen = () => {
    console.log("connected");
    webSocket.send("asdasdasd");
};

