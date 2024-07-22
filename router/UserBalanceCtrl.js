const UserBalanceModel = require('../models/UserBalance');
const DeployModel = require('../models/Deploy');
const Utils = require("../config/Utils");
const {check, body, validationResult} = require('express-validator');
const jwt = require("jsonwebtoken");

module.exports = {

    getHoldersList: (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return Utils.getErrors(res, errors);
        } else {
            Utils.checkAuthentication(req, res, jwt)
            .then(async _user => {
                if (_user) {
                    let {tokenName} = req.query;
                    const tokenData = await DeployModel.findOne({ name: tokenName }).lean();
                    if (tokenData) {
                        // Récupérer les holders avec le tokenName spécifié
                        const holders = await UserBalanceModel.find({ tokenName: tokenName }).sort({ balance: -1 }).lean();
                
                        // Calculer le pourcentage et formater la liste
                        const holdersList = holders.map((holder, index) => {
                            const percentage = (holder.balance / tokenData.max) * 100;
                            return {
                                Rank: index + 1,
                                Address: holder.address,
                                Percentage:  Number(percentage.toFixed(2)),
                                Amount: holder.balance
                            };
                        });
                
                        return Utils.getJsonResponse('ok', 200, '', holdersList, res);
                    } else {
                        return Utils.getJsonResponse('ok', 200, '', {}, res);
                    }
                   
                } else {
                    return Utils.getJsonResponse('error', 404, '', {}, res);
                }
            })
            .catch(_ => {
                return Utils.getJsonResponse('error', 400, '', {}, res);
            });
        }
    },
    myAsset: (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return Utils.getErrors(res, errors);
        } else {
            Utils.checkAuthentication(req, res, jwt)
            .then(async _user => {
                if (_user) {
                    let {holderAddress} = req.query;
                    // Find all tokens associated with the holder's address
                    let userBalances = await UserBalanceModel.find({ address: holderAddress }).lean();

                    // Get unique token names from userBalances
                    let tokenNames = [...new Set(userBalances.map(balance => balance.tokenName))];

                    // Fetch deploy information for each token name
                    let tokens = await DeployModel.find({ name: { $in: tokenNames } }).lean();

                    // Map the tokens to include name, logo, and balance
                    let response = tokens.map(token => {
                        let balanceEntry = userBalances.find(balance => balance.tokenName === token.name);
                        return {
                            name: token.name,
                            logo: token.logo,
                            balance: balanceEntry ? balanceEntry.balance : 0,
                            price: Math.floor(Math.random() * (250 - 1 + 1)) + 1,
                        };
                    }); 
                    return Utils.getJsonResponse('ok', 200, '', response, res);              
                } else {
                    return Utils.getJsonResponse('error', 404, '', {}, res);
                }
            })
            .catch(_ => {
                return Utils.getJsonResponse('error', 400, '', {}, res);
            });
        }
    }
    

}


module.exports.validate = (method) => {
    switch (method) {
        case 'tokenName': {
            return [
                check('tokenName', "tokenName parameter does not exist").exists(),
                check('tokenName', "tokenName parameter must not be empty").trim().not().isEmpty(),
                check('tokenName', "Your project don't exist").trim().custom(value => {
                    return new Promise(async (resolve, reject) => {
                        const tokenInfo = await DeployModel.findOne({ name: value}).lean();
                        if (tokenInfo) {
                            return resolve();
                        } else {
                            return reject();
                        }
                    })
                })
            ]
        }
        case 'holderAddress': {
            return [
                check('holderAddress', "holderAddress parameter does not exist").exists(),
                check('holderAddress', "holderAddress parameter must not be empty").trim().not().isEmpty()
            ]
        }
        default : {

        }
    }
}