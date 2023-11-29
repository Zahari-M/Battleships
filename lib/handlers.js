exports.home = (req, res) => res.render('home', {user: 'Guest', message: ', please sign in.'});

exports.signin = (req, res) => res.render('signin');

exports.signup = (req, res) => res.render('signup');