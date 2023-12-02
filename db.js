/*
Dummy database
Todo: implement functions with a real database
*/
let map = new Map();

exports.containsUser = function(username, f) {
    f(map.has(username));
};

exports.addUser = function(obj, f) {
    if (typeof obj.username !== 'string') {
        f(new Error());
        return;
    }
    map.set(obj.username, 
        {username: obj.username, salt: obj.salt, hashed_password: obj.hashed_password, points: 0});
    f();
}

exports.getUser = function(username, f) {
    f(map.get(username));
}

exports.addPoint = function(username) {
    if (map.get(username)) {
        map.get(username).points++;
    }
}

exports.getPoints = function(username, f) {
    f(map.get(username).points);
}