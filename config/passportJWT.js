const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const UserModel = require('../models/User');
const passportJWT = require("passport-jwt");

passport.use(new LocalStrategy({
        usernameField: 'login',
        passwordField: 'password'
    },
    (login, password, done) => {
    console.log('here ')
        UserModel.getUserByLogin(login).then( user => {

            if (user) {
                UserModel.comparePassword(password, user.password, function (err, isMatch) {
                    if (err) {
                        return done(err);
                    }
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        // Invalid password
                        return done(null, false, 'Login ou Mot de passe incorrect');
                    }
                });
            } else {
                // This email is not found
                return done(null, false, 'login introuvable');
            }
        }).catch( _err => {
            if (err) {
                return done(err);
            }
        })
    }
));

