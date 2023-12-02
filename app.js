const express = require("express");
const { engine } = require('express-handlebars');
const session = require('express-session');
const passport = require('passport');

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

const secret = '123qwerty';

app.use(express.urlencoded({extended: false}));
app.use(express.static('public'))
app.use(session({
  secret: secret,
  resave: false,
  saveUninitialized: false
  // TODO: implement database store
}));
app.use(passport.authenticate('session'));
app.use(function(req, res, next) {
  var msgs = req.session.messages || [];
  res.locals.formmessage = msgs[0];
 // res.locals.hasMessages = !! msgs.length;
  req.session.messages = [];
  next();
});

app.use(function(req, res, next) {
  if (req.user) {
    res.locals.signedin = true;
  }
  else {
    res.locals.signedin = false;
  }
  next();
});

app.get('/', handlers.home);

app.get('/signin', handlers.signin);

app.post('/signin', handlers.signinpost);

app.get('/signup', handlers.signup);

app.post('/signup', handlers.signuppost);

app.get('/signout', handlers.signout);

app.use(function(req, res, next) {
  let obj = new Error();
  obj.status = 404;
  next(obj);
});

// error handler
app.use(function(err, req, res, next) {
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



app.listen(port, "localhost", () => console.log(
    `Express started on http://localhost:${port}; ` +
    `press Ctrl-C to terminate.`));