module.exports.home = (req, res) => res.render('home', {user: 'Guest', message: ', please sign in.'});

module.exports.signin = (req, res) => res.render('signin');