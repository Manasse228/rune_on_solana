const jwt = require('jsonwebtoken');
const mongoConf = require('./../config/mongoDB');
const bcrypt = require('bcryptjs');
const UserModel = require('./../models/User');
const passport = require('passport');

const Utils = require('../config/Utils');
const {check, body, validationResult} = require('express-validator');

module.exports = {

    initAdminCreation: () => {
        const login = "@memefiInscription";
        const password = "@ghyBreed.fi@life78";
        UserModel.getUserByLogin(login).then(_user => {
            if (!_user) {
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(password, salt, async (err, hash) => {
                        const userModelInstance = new UserModel();
                        userModelInstance.login = login;
                        userModelInstance.password = hash;
                        userModelInstance.save()
                            .then((user) => {
                                const token = module.exports.createToken(user);
                                UserModel.setLastToken(login, token)
                                .then(_result => {
                                })
                                .catch(_err => {
                                })
                            })
                            .catch(err => {
                                console.log("Echec lors de la création du compte Admin ", err);
                            })
                    })
                });
            }
        });
    },
    // Create JWT Token
    createToken: (_user) => {
        const token = jwt.sign(
            {id: _user._id, code: Utils.getDigicode(15)},
            Utils.getSecret(), {
                expiresIn: '700d'
            });
        return token;
    },
    // login
    login: async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return Utils.getErrors(res, errors);
        } else {

            passport.authenticate('local', {session: false}, (err, user, info) => {

                console.log(err, user, info)

                if (err) {
                    return Utils.getJsonResponse('error', 500, 'Internal error', '', res);
                }

                if (info) {
                    return Utils.getJsonResponse('error', 400, info, '', res);
                }

                req.login(user, {session: false}, (err) => {
                    if (err) {
                        return Utils.getJsonResponse('error', 400, err, '', res);
                    }

                    const data = {
                        token: module.exports.createToken(user),
                        user: user
                    };

                    UserModel.setLastToken(user.login, data.token)
                        .then(_result => {
                            return Utils.getJsonResponse('ok', 200, '', data, res);
                        })
                        .catch(_err => {
                            return Utils.getJsonResponse('error', 404, 'Réessayer la connexion SVP', _err, res);
                        })

                });
            })(req, res);
        }
    },
    createAdmin: (req, res) => {
        const errors = validationResult(req);
        let {login, password} = req.body;
        login = login.trim().toLowerCase();
        password = password.trim();
        if (!errors.isEmpty()) {
            return Utils.getErrors(res, errors);
        } else {
            Utils.checkAuthentication(req, res, jwt).then(async _user => {
                if (_user) {
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(password, salt, async (err, hash) => {
                            if (err) {
                                return Utils.getJsonResponse('error', 404, err, '', res);
                            }
                            const userModelInstance = new UserModel();
                            userModelInstance.password = hash;
                            userModelInstance.login = login;
                            userModelInstance.save()
                                .then((_user) => {
                                    return Utils.getJsonResponse('ok', 200, '', _user, res);
                                })
                                .catch(err => {
                                    return Utils.getJsonResponse('error', 404, err, '', res);
                                });
                        });
                    });
                } else {
                    return Utils.getJsonResponse('error', 404, "Impossible d'établir la connexion, Try Again ", '', res);
                }
            })
        }
    },

}

module.exports.validate = (method) => {

    switch (method) {
        case 'login': {
            return [
                body('login', "Paramètre login inexistant").exists(),
                body('login', "Le login est vide").trim().not().isEmpty(),
                body('password', "Paramètre password inexistant").exists(),
                body('password', "Mot de passe vide").not().isEmpty(),
            ]
        }
        default : {

        }
    }

}