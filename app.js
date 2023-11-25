const express = require("express");
const { engine } = require('express-handlebars');
const port = process.env.PORT || 8080;
const app = express();

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.static(__dirname + '/public'))

app.get('/', (req, res) => res.render('test'));

app.listen(port, "localhost", () => console.log(
    `Express started on http://localhost:${port}; ` +
    `press Ctrl-C to terminate.`));