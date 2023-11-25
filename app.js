const express = require("express");
const { engine } = require('express-handlebars');

const port = process.env.PORT || 8080;

const app = express();
const expressWs = require('express-ws')(app); 


app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.static('public'))

app.get('/', (req, res) => res.render('home'));
app.ws('/', function(ws, req) {
    ws.on('message', function(msg) {
        console.log(msg);
    });
});

app.listen(port, "localhost", () => console.log(
    `Express started on http://localhost:${port}; ` +
    `press Ctrl-C to terminate.`));