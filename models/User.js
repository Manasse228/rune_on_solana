const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    login: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    lastJwtToken: {
        type: String,
        required: false
    }
});

UserSchema.methods.toJSON = function () {
    let obj = this.toObject();
    delete obj.password;
    delete obj.lastJwtToken;
    delete obj.login;
    delete obj.__v;
    return obj;
};

const User = mongoose.model('User', UserSchema);
module.exports = User;

module.exports.getUserByLogin = (login) => {
    return new Promise((resolve) => {
        let result = User.findOne({login: login}, {timeout: false});
        resolve(result);
    })
}

// Set user's last JWT Token
module.exports.setLastToken = (_login, _lastJwtToken) => {
    return new Promise((resolve) => {
        const query = {login: _login};
        const newValues = {$set: {lastJwtToken: _lastJwtToken}};
        let result = User.updateOne(query, newValues);
        resolve(result);
    })
};

// Search user's jwtToken
module.exports.checkUserToken = (_jwtToken, callback) => {
    User.findOne({lastJwtToken: _jwtToken}, callback);
};

// Compare passpord and its hash
module.exports.comparePassword = function (candidatePassword, hash, callback) {
    bcrypt.compare(candidatePassword, hash, function (err, isMatch) {
        if (err) throw err;
        callback(null, isMatch);
    });
};

