const DeployModel = require('../models/Deploy');
const TransferModel = require('../models/Transfer');
const UserBalanceModel = require('../models/UserBalance');
const solanaWeb3 = require('@solana/web3.js');
const cron = require('node-cron');
const Utils = require("../config/Utils");
const {check, body, validationResult} = require('express-validator');
const jwt = require("jsonwebtoken");


const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'), 'confirmed');

module.exports = {

    updateFairDeploy: async () => {
        const currentSlot = await connection.getSlot('confirmed');
        cron.schedule('* * * * *', async () => {
            try {
                const deploys = await DeployModel.find({
                    startBlock: { $gt: 0 },
                    endBlock: { $gt: 0 },
                    alreadyPremine: false,
                    endBlock: { $lt: currentSlot },
                });
        
                for (const deploy of deploys) {
                    deploy.max = deploy.remain;
                    deploy.remain = 0;
                    deploy.mintOver = true;
        
                    await deploy.save();
                }
        
                console.log('CRON job executed successfully');
            } catch (error) {
                console.error('Error during CRON job execution:', error);
            }
        });
    },
    calculateMintProgress: (startBlock, endBlock, currentBlock) => {
        if (currentBlock < startBlock) {
            return 0; // Minting hasn't started yet
        }
        if (currentBlock > endBlock) {
            return 100; // Minting is complete
        }
        const progress = ((currentBlock - startBlock) / (endBlock - startBlock)) * 100;
        return progress;
    },
    mintAvailable: (req, res) => {
        const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return Utils.getErrors(res, errors);
            } else {
                Utils.checkAuthentication(req, res, jwt)
                .then(async _user => {
                    if (_user) {

                        let {tokenName} = req.query;
                        const result = await DeployModel.getTokenByName(tokenName);
                        if (result) {
                            const dataObject = {
                                p: "fast-20",
                                op: "mint",
                                tick: result.name,
                                amt: result.lim
                            };
                            const data = `data:,${JSON.stringify(dataObject)}`;
        
                            if (!result.mintOver) {
                                if (Number(result.startBlock) >0 && Number(result.endBlock) >0) { // fair mint
                                    const currentSlot = await connection.getSlot('confirmed');
                                    if (Number(currentSlot) > Number(result.endBlock)) {
        
                                        await DeployModel.updateMany(
                                            {name: tokenName },
                                            { $set: { mintOver: true, max: result.remain, remain: 0 } }
                                        );

                                        return Utils.getJsonResponse('ok', 201, '', 'Minting of this token is closed.', res);
                                    } if (Number(currentSlot) < Number(result.startBlock)) { 
                                        return Utils.getJsonResponse('ok', 201, '', 'Minting of this token is not open yet', res);
                                    } else {
                                        return Utils.getJsonResponse('ok', 200, '', data, res);
                                    }
                                } else { // fix cap
                                    return Utils.getJsonResponse('ok', 200, '', data, res);
                                }
                            } else {
                                return Utils.getJsonResponse('ok', 201, '', 'Minting of this token is closed.', res);
                            }
                        } else {
                            return Utils.getJsonResponse('ok', 201, '', 'The token is not exist', res);
                        }
                    } else {
                        return Utils.getJsonResponse('error', 201, '', 'The Solana blockchain is congested. Please try again later.', res);
                    }
                })
                .catch(_ => {
                    return Utils.getJsonResponse('error', 201, '', 'The Solana blockchain is congested. Please try again later.', res);
                });
            }
    },
    getTokenInfo: (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return Utils.getErrors(res, errors);
        } else {
            Utils.checkAuthentication(req, res, jwt)
            .then(async _user => {
                if (_user) {
                    
                    module.exports.getCurrentSlot()
                    .then(async currentSlot => {

                        let {tokenName} = req.query;
                        let result = await DeployModel.getTokenByName(tokenName);
                        const countTransfer = await TransferModel.countDocuments({ tokenName });
                        result = result.toObject();
    
                        if (result) {
                            result.currentBlock = currentSlot;
    
                            if (result.startBlock >0 && result.endBlock >0) { // fair
                                result.progress = module.exports.calculateMintProgress(result.startBlock, result.endBlock, currentSlot);
                            } else { //fix
                                const i = (result.remain/result.max)*100 ;
                                const s = 100 - i;
                                result.progress = s;
                            }
    
                            const count = await UserBalanceModel.countDocuments({ tokenName: tokenName });
                            result.holders = count;
                            result.transfercount= Number(countTransfer);

                            return Utils.getJsonResponse('ok', 200, '', result, res);
                        } else {
                            return Utils.getJsonResponse('ok', 201, '', {}, res);
                        }
                    })
                    .catch(_ => {
                        return Utils.getJsonResponse('error', 201, '', {}, res);
                    });
                } else {
                    return Utils.getJsonResponse('error', 201, '', {}, res);
                }
            })
            .catch(_ => {
                return Utils.getJsonResponse('error', 201, '', {}, res);
            });
        }
    },
    getCurrentSlot: async () => {
        const currentSlot = await connection.getSlot('confirmed');
        return currentSlot;
    },
    getUpComingMint: async () => {
        return new Promise(async (resolve, reject) => {
            module.exports.getCurrentSlot()
            .then(async currentSlot => {
                let result = await DeployModel.getUpComingMint(currentSlot);
                if (result) {
                    resolve(result)
                } else {
                    resolve({})
                }
            })
            .catch(_ => {
                resolve({})
            });
        })
    },
    getMints: (deploy) => {
        if (Number(deploy.startBlock) > 0) {
            return (Number(deploy.max) / Number(deploy.lim));
        } else {
            const r = Number(deploy.max) - Number(deploy.remain);
            const p = (Number(deploy.max) * Number(deploy.premine)) / 100;
            const i = r - p;
            return i;
        }
    },
    calculateFixProgress: (deploy) => {
        const i = (deploy.remain / deploy.max) * 100;
        return 100 - i;
    },
    getOnGoingMint: async () => {
        return new Promise(async (resolve, reject) => {
            module.exports.getCurrentSlot()
            .then(async currentBlock => {
                try {
                    let results = await DeployModel.find({
                        $or: [
                            { $and: [{ startBlock: { $lte: currentBlock } }, { endBlock: { $gte: currentBlock } }] },
                            { remain: { $gt: 0 } }
                        ]
                    }).sort({ blockNumber: -1 }).lean();
        
                    let response = await Promise.all(results.map(async (deploy) => {
                        const holdersCount = await UserBalanceModel.countDocuments({ tokenName: deploy.name });
        
                        return {
                            logo: deploy.logo,
                            name: deploy.name,
                            max: deploy.max,
                            mints: module.exports.getMints(deploy),
                            holders: holdersCount,
                            premine: deploy.premine,
                            blockTime: deploy.blockTime,
                            progress: (Number(deploy.startBlock) >0) ? module.exports.calculateMintProgress(deploy.startBlock, deploy.endBlock, currentBlock).toFixed(2) : module.exports.calculateFixProgress(deploy)
                        };
                    }));
        
                    resolve(response);
                } catch (error) {
                    console.error(error);
                    resolve({});
                }
            })
            .catch(_ => {
                resolve({})
            });
        })
    },
    getPassedMint: async () => {
        return new Promise(async (resolve, reject) => {
            module.exports.getCurrentSlot()
            .then(async currentBlock => {

                try {
                    let results = await DeployModel.find({
                        $or: [
                            {
                                $and: [
                                    { endBlock: { $lt: currentBlock } },
                                    { startBlock: { $gt: 0 } },
                                    { endBlock: { $gt: 0 } }
                                ]
                            },
                            {
                                $and: [
                                    { remain: { $lte: 0 } },
                                    { startBlock: { $lte: 0 } },
                                    { endBlock: { $lte: 0 } }
                                ]
                            }
                        ]
                    }).sort({ blockNumber: -1 }).lean();
        
                    let response = await Promise.all(results.map(async (deploy) => {
                        const holdersCount = await UserBalanceModel.countDocuments({ tokenName: deploy.name });
        
                        return {
                            logo: deploy.logo,
                            name: deploy.name,
                            max: deploy.max,
                            mints: module.exports.getMints(deploy),
                            holders: holdersCount,
                            premine: deploy.premine
                        };
                    }));
        
                    resolve(response);
                } catch (error) {
                    console.error(error);
                    resolve({});
                }
            })
            .catch(_ => {
                resolve({})
            });
        })  
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
        default : {

        }
    }
}