const passport = require('passport');
const LocalStrategy = require('passport-local');
const crypto = require('crypto');
const db = require('../db.js');

passport.use(new LocalStrategy(function verify(username, password, cb) {
    db.getUser(username, function(user) {
      if (!user) { return cb(null, false, { message: 'Incorrect username or password.' }); }
      
      crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
        if (err) { return cb(err); }
        if (!crypto.timingSafeEqual(user.hashed_password, hashedPassword)) {
          return cb(null, false, { message: 'Incorrect username or password.' });
        }
        return cb(null, user);
      });
    });
}));

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
        cb(null, { username: user.username });
    });
});

passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});

exports.home = function (req, res) {
    res.locals.user = req.user ? req.user.username : 'Guest';
    res.locals.message = "";
    if (req.user) {
        db.getPoints(req.user.username, function(points) {
            res.locals.message = `, you have ${points} points.`
            res.render('home')
        });
        return;
    }
    res.render('home');
};

exports.signin = (req, res) => res.render('signin');

exports.signinpost = passport.authenticate('local', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/signin',
    failureMessage: true
});

exports.signup = (req, res) => res.render('signup');

exports.signuppost = function(req, res, next) {
    const regex = /[^\s*]/;
    if(!(regex.test(req.body.password) && regex.test(req.body.username))) {
        res.render('signup', {formmessage: 'Invalid input'});
        return;
    }

    var salt = crypto.randomBytes(16);
    crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function (err, hashedPassword) {
        if (err) { return next(err); }
        db.containsUser(req.body.username, function(exists) {
            if(exists) {
                res.render('signup', {formmessage: 'User already exists'});
                return;
            }
            if(req.body.password !== req.body.repeatedpassword) {
                res.render('signup', {formmessage: 'Passwords do not match'});
                return;
            }
            
            db.addUser({username: req.body.username, hashed_password: hashedPassword, salt: salt}, function (err) {
                if (err) { return next(err); }
                let user = {
                    username: req.body.username
                };
                req.login(user, function (err) {
                    if (err) { return next(err); }
                    res.redirect('/');
                });
            });
        });
    });
};

exports.signout = function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
}