const UserBalanceModel = require('../models/UserBalance');
const DeployModel = require('../models/Deploy');
const BurnModel = require('../models/Burn');
const { PublicKey } = require('@solana/web3.js');
const solanaWeb3 = require('@solana/web3.js');
const Utils = require("../config/Utils");
const {check, body, validationResult} = require('express-validator');
const jwt = require("jsonwebtoken");

const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'), 'confirmed');

module.exports = {

    checkBalanceAndRent: async (publicKey) => {
        const balance = await connection.getBalance(publicKey);
        const rentExemption = await connection.getMinimumBalanceForRentExemption(0); // Adjust this based on the account data size
        return balance >= rentExemption;
    },
    getTransactionDetailsAndActions: async (txSignature) => {

        const trxInfo =  {
            from: "",
            to: "",
            blocktime: "",
            blocknumber: "",
            signature: "",
            instructions: "",
            memo: "",
        }

        try {
            // Fetch the transaction details
            const transaction = await connection.getTransaction(txSignature, { maxSupportedTransactionVersion: 0 });

            // Check if transaction is retrieved
            if (!transaction) {
                return trxInfo;
            }
    
            const blocktime = transaction.blockTime;
            const blocknumber = transaction.slot;
            const instructions = transaction.transaction.message.instructions;
            const accountKeys = transaction.transaction.message.accountKeys;
    
            let fromAddress = null;
            let toAddress = null;
            let memoData = null;
    
            // Function to parse and decode instruction data
            function parseInstruction(instruction) {
                const programIdIndex = instruction.programIdIndex;
                const programId = accountKeys[programIdIndex].toBase58();
    
                const accounts = (instruction.accounts || []).map(index => accountKeys[index].toBase58());
                const data = instruction.data;
    
                // Check if this is a System Program transfer instruction
                if (programId === solanaWeb3.SystemProgram.programId.toBase58() && accounts.length >= 2) {
                    fromAddress = accounts[0];
                    // Ensure the `To` address isn't the System Program ID
                    toAddress = accounts.find(address => address !== fromAddress && address !== solanaWeb3.SystemProgram.programId.toBase58());
                }
    
                return {
                    programId,
                    accounts,
                    data,
                };
            }
    
            // Parse all instructions
            const parsedInstructions = instructions.map(parseInstruction);
    
            // Extract memo data from log messages
            const logMessages = transaction.meta.logMessages || [];
            const memoLog = logMessages.find(log => log.includes('Program log: Memo'));
            if (memoLog) {
                const jsonString = memoLog.replace(/\\"/g, '"');
                const regex = /data:,(\{.*\})/;
                const match = jsonString.match(regex);
                if (match && match[1]) {
                    memoData = match[1];
                }
            }

            trxInfo.from = fromAddress || '';
            trxInfo.to = (toAddress) ? toAddress : fromAddress;
            trxInfo.blocktime = blocktime;
            trxInfo.blocknumber = blocknumber;
            trxInfo.signature = txSignature;
            trxInfo.memo = memoData || {};
            trxInfo.instructions = parsedInstructions;

            return trxInfo;
        } catch (error) {
            console.error('Error fetching transaction details:', error.message);
            return trxInfo;
        }
    },
    checkBurn: (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return Utils.getErrors(res, errors);
        } else {
            Utils.checkAuthentication(req, res, jwt)
            .then(async _user => {
                if (_user) {
                    const { tokenName, senderAddress, amount } = req.query;
                    const errors = [];

                    const senderBalance = await UserBalanceModel.findOne({ address: senderAddress, tokenName: tokenName });
                    if (!senderBalance || senderBalance.balance < Number(amount)) {
                        errors.push('<p>Insufficient balance</p>');
                    }

                    const testRent = await module.exports.checkBalanceAndRent(new PublicKey(senderAddress));
                    if (!testRent) {
                        errors.push('<p>Your account does not have enough SOL to allow you this burn</p>');
                    }

                    return Utils.getJsonResponse('ok', 200, '', errors, res);
                } else {
                    return Utils.getJsonResponse('error', 200, '', ['<p>The Solana blockchain is congested. Please try again later.</p>'], res);
                }
            })
            .catch(_ => {
                return Utils.getJsonResponse('error', 200, '', ['<p>The Solana blockchain is congested. Please try again later.</p>'], res);
            });
        }
    },
    saveBurn: (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return Utils.getErrors(res, errors);
        } else {
            Utils.checkAuthentication(req, res, jwt)
            .then(async _user => {
                if (_user) {

                    const { signature, from } = req.body;
                    const trxDetails = await module.exports.getTransactionDetailsAndActions(signature);

                    if (trxDetails !== null && trxDetails.from && Object.keys(trxDetails.memo).length > 0) {

                        const senderAddress = trxDetails.from;
                        const toAddress = trxDetails.to;
                        const blocktime = trxDetails.blocktime;
                        const blocknumber = trxDetails.blocknumber;
                        const transactionMemo = JSON.parse(trxDetails.memo);

                        const senderBalance = await UserBalanceModel.findOne({ address: senderAddress, tokenName: transactionMemo.tick });
                        const tokenData = await DeployModel.getTokenByName(transactionMemo.tick);

                        if (!senderBalance || senderBalance.balance < Number(transactionMemo.amt)) {
                            return Utils.getJsonResponse('ok', 201, '', ['<p>Insufficient balance</p>'], res);
                        }

                        if (from === senderAddress && tokenData && (Number(blocknumber) > Number(tokenData.blockNumber))) {

                            const operationsNewBurn = {
                            updateOne: {
                                filter: {transactionHash: signature},
                                update: {
                                    $setOnInsert: {
                                        transactionHash : signature,
                                        from : from,
                                        tokenName : transactionMemo.tick,
                                        amount : Number(transactionMemo.amt),
                                        blockTime : Number(blocktime),
                                        blockNumber : Number(blocknumber)
                                    }
                                },
                                upsert: true
                            }}

                            const operationBurnDeploy =  {
                                updateOne: {
                                    filter: {
                                        name: transactionMemo.tick,
                                    },
                                    update: {
                                        $inc: {
                                            burnSupply: Number(transactionMemo.amt),
                                        }
                                    },
                                    upsert: true
                                }
                            };

                            const operationsMinusBalance =  {
                                updateOne: {
                                    filter: {
                                        address: from,
                                        tokenName: transactionMemo.tick,
                                    },
                                    update: {
                                        $inc: {
                                            balance: -Number(transactionMemo.amt),
                                        }
                                    }
                                }
                            };
    
                            BurnModel.bulkWrite([operationsNewBurn])
                                .then(result => {
                                    UserBalanceModel.bulkWrite([operationsMinusBalance])
                                        .then( _ => {
                                            DeployModel.bulkWrite([operationBurnDeploy])
                                                .then( _ => {
                                                    return Utils.getJsonResponse('ok', 200, '', true, res);
                                                })
                                                .catch(err => {
                                                    console.error('Error with bulk DeployModel', err);
                                                    return Utils.getJsonResponse('ok', 201, '', ['<p>The Solana blockchain is congested. Please try again later.</p>'], res);
                                                });
                                                })
                                        .catch(err => {
                                            console.error('Error with bulk UserBalanceModel Burn', err);
                                            return Utils.getJsonResponse('ok', 201, '', ['<p>The Solana blockchain is congested. Please try again later.</p>'], res);
                                        });
                                })
                                .catch(err => {
                                    console.error('Error with bulk BurnModel', err);
                                    return Utils.getJsonResponse('ok', 201, '', ['<p>The Solana blockchain is congested. Please try again later.</p>'], res);
                                });

                        } else {
                            return Utils.getJsonResponse('ok', 201, '', ['<p>Your blockchain transaction is not valid.</p>'], res);
                        }
                    } else {
                        return Utils.getJsonResponse('ok', 201, '', ['<p>Your blockchain transaction is not valid.</p>'], res);
                    }
                } else {
                    return Utils.getJsonResponse('error', 201, '', ['<p>The Solana blockchain is congested. Please try again later.</p>'], res);
                }
            })
            .catch(_ => {
                return Utils.getJsonResponse('error', 201, '', ['<p>The Solana blockchain is congested. Please try again later.</p>'], res);
            });
        }
    },
    myBurnList: (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return Utils.getErrors(res, errors);
        } else {
            Utils.checkAuthentication(req, res, jwt)
            .then(async _user => {
                if (_user) {

                    const { holderAddress } = req.query;
                    const burns = await BurnModel.find({ from: holderAddress }).lean();
                        
                    const deploys = await DeployModel.find({}).lean();
                    const deployMap = deploys.reduce((acc, deploy) => {
                        acc[deploy.name] = deploy;
                        return acc;
                    }, {});

                    const result = burns.map(burn => {
                        const deploy = deployMap[burn.tokenName] || {};
                        return {
                            tokenAmount: burn.amount,
                            tokenName: burn.tokenName,
                            logo: deploy.logo || '#',
                            blockNumber: burn.blockNumber,
                            blockTime: burn.blockTime,
                            transactionHash: burn.transactionHash,
                        };
                    });
                    
                    return Utils.getJsonResponse('ok', 200, '', result, res);
                } else {
                    return Utils.getJsonResponse('error', 200, '', ['<p>The Solana blockchain is congested. Please try again later.</p>'], res);
                }
            })
            .catch(_ => {
                return Utils.getJsonResponse('error', 200, '', ['<p>The Solana blockchain is congested. Please try again later.</p>'], res);
            });
        }
    },

}


module.exports.validate = (method) => {
    switch (method) {
        case 'checkBurn': {
            return [
                check('tokenName', "<p>tokenName parameter does not exist</p>").exists(),
                check('tokenName', "<p>tokenName parameter must not be empty</p>").trim().not().isEmpty(),
                check('tokenName', "<p>This token does not exist</p>").trim().custom(value => {
                    return new Promise(async (resolve, reject) => {
                        const tokenInfo = await DeployModel.findOne({ name: value}).lean();
                        if (tokenInfo) {
                            return resolve();
                        } else {
                            return reject();
                        }
                    })
                }),

                check('senderAddress', "<p>senderAddress parameter does not exist</p>").exists(),
                check('senderAddress', "<p>senderAddress parameter must not be empty</p>").trim().not().isEmpty(),

                check('amount', "<p>The amount parameter does not exist</p>").exists(),
                check('amount', "<p>The amount must not be empty</p>").trim().not().isEmpty(),
                check('amount', "<p>The amount must be a number</p>").trim().isInt(),
                check('amount', "<p>The amount must be greater than 0</p>").trim().custom(value => {
                    return new Promise((resolve, reject) => {
                        if (value && value >= 1) {
                            return resolve();
                        } else {
                            return reject();
                        }
                    })
                }),
            ]
        }
        case 'saveBurn': {
            return [
                body('from', "<p>from parameter does not exist</p>").exists(),
                body('from', "<p>from parameter must not be empty</p>").trim().not().isEmpty(),

                body('signature', "<p>signature parameter does not exist</p>").exists(),
                body('signature', "<p>signature parameter must not be empty</p>").trim().not().isEmpty(),
                body('signature', "<p>This signature already exist</p>").trim().custom(value => {
                    return new Promise(async (resolve, reject) => {
                        const transferExists = await BurnModel.exists({ transactionHash: value });
                        if (transferExists) {
                            return reject();
                        } else {
                            return resolve();
                        }
                    })
                }),
            ]
        }
        case 'holderAddress': {
            return [
                check('holderAddress', "<p>holderAddress parameter does not exist</p>").exists(),
                check('holderAddress', "<p>holderAddress parameter must not be empty</p>").trim().not().isEmpty(),
            ]
        }
        default : {

        }
    }
}