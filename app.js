const express = require("express");
const { engine } = require('express-handlebars');
const handlers = require('./lib/handlers.js');

const port = process.env.PORT || 8080;

const app = express();
const expressWs = require('express-ws')(app); 


app.engine('handlebars', engine({helpers: {
    section: function(name, options) {
      if(!this._sections) this._sections = {};
      this._sections[name] = options.fn(this);
      return null;
    }
  }}));
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.static('public'))

app.get('/', handlers.home);

app.get('/signin', handlers.signin);

app.get('/signup', handlers.signup);

app.listen(port, "localhost", () => console.log(
    `Express started on http://localhost:${port}; ` +
    `press Ctrl-C to terminate.`));