const DeployModel = require('../models/Deploy');
const MintModel = require('../models/Mint');
const TransferModel = require('../models/Transfer');
const UserBalanceModele = require('../models/UserBalance');
const solanaWeb3 = require('@solana/web3.js');
const Utils = require("../config/Utils");
const {check, body, validationResult} = require('express-validator');
const jwt = require("jsonwebtoken");

const rpcEndpoint = 'https://api.mainnet-beta.solana.com/';
//const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'), 'confirmed');
const connection = new solanaWeb3.Connection(rpcEndpoint, 'confirmed');


module.exports = {

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
    
            /*return {
                from: fromAddress || '',  // Fallback if sender is not found
                to: (toAddress) ? toAddress : fromAddress,      // Fallback if recipient is not found
                blocktime: blocktime,
                blocknumber: blocknumber,
                signature: txSignature,
                instructions: parsedInstructions,
                memo: memoData || {},  // Fallback if memo is not found
            };*/
        } catch (error) {
            console.error('Error fetching transaction details:', error.message);
            return trxInfo;
        }
    },
    saveMint: (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return Utils.getErrors(res, errors);
        } else {
            Utils.checkAuthentication(req, res, jwt)
            .then(async _user => {
                if (_user) {
                    let {tick, signature, from} = req.body;
                    const tokenData = await DeployModel.getTokenByName(tick);
                    const trxDetails = await module.exports.getTransactionDetailsAndActions(signature);
                    const currentSlot = await connection.getSlot('confirmed');
                    
                    if (!tokenData.mintOver && trxDetails !== null && trxDetails.from && Object.keys(trxDetails.memo).length > 0) {
        
                        const fromDetails = trxDetails.from;
                        const to = trxDetails.to;
                        const blocktime = trxDetails.blocktime;
                        const blocknumber = trxDetails.blocknumber;
                        const transactionMemo = JSON.parse(trxDetails.memo);
        
                        if ( (Number(blocknumber) > Number(tokenData.blockNumber)) && (from === fromDetails) && (Number(tokenData.lim) === Number(transactionMemo.amt)) && (transactionMemo.tick === tokenData.name)) {
        
                            const operationsNewMint = {
                                updateOne: {
                                    filter: {transactionHash: signature},
                                    update: {
                                        $setOnInsert: {
                                            tokenAmount : Number(transactionMemo.amt),
                                            blockTime : Number(blocktime),
                                            transactionHash : signature,
                                            to : to,
                                            tokenName : transactionMemo.tick,
                                            blockNumber : Number(blocknumber)
                                        }
                                    },
                                    upsert: true
                            }}
        
                            const operationsAddBalance =  {
                                    updateOne: {
                                        filter: {
                                            address: to,
                                            tokenName: transactionMemo.tick,
                                        },
                                        update: {
                                            $inc: {
                                                balance: Number(transactionMemo.amt),
                                            }
                                        },
                                        upsert: true
                                    }
                            };
        
                            let updateTokenInfo = {}
                            if (Number(tokenData.startBlock) >0 && Number(tokenData.endBlock) >0) {
                                if (currentSlot > Number(tokenData.endBlock)) { // close fair mint
                                    updateTokenInfo =  {
                                        updateOne: {
                                            filter: {
                                                transactionHash: tokenData.transactionHash,
                                            },
                                            update: {
                                                /*$inc: {
                                                    remain: Number(transactionMemo.amt),
                                                },*/
                                                mintOver: true,
                                                max: (tokenData.remain + Number(transactionMemo.amt)),
                                                remain: 0,
                                                completedTime: Date.now()                                            }
                                        }
                                    };
                                } else {
                                    updateTokenInfo =  {
                                        updateOne: {
                                            filter: {
                                                transactionHash: tokenData.transactionHash,
                                            },
                                            update: {
                                                $inc: {
                                                    remain: Number(transactionMemo.amt),
                                                }
                                            }
                                        }
                                    };
                                }
                            } else {
                                if (Number(tokenData.remain - transactionMemo.amt) <= 0) { // close mint
                                    updateTokenInfo =  {
                                        updateOne: {
                                            filter: {
                                                transactionHash: tokenData.transactionHash,
                                            },
                                            update: {
                                                $inc: {
                                                    remain: -Number(transactionMemo.amt),
                                                },
                                                mintOver: true,
                                                completedTime: Date.now()
                                            }
                                        }
                                    };
                                } else {
                                    updateTokenInfo =  {
                                        updateOne: {
                                            filter: {
                                                transactionHash: tokenData.transactionHash,
                                            },
                                            update: {
                                                $inc: {
                                                    remain: -Number(transactionMemo.amt),
                                                }
                                            }
                                        }
                                    };
                                }
                            }
        
                            MintModel.bulkWrite([operationsNewMint])
                                .then(result => {
                                    UserBalanceModele.bulkWrite([operationsAddBalance]).then( _ => {
                                        DeployModel.bulkWrite([updateTokenInfo]).then( _ => {
                                            return Utils.getJsonResponse('ok', 200, '', 0, res);
                                        })
                                        .catch(err => {
                                            console.error('Error with bulk DeployModel Transfer', err);
                                            return Utils.getJsonResponse('error', 201, '', 1, res);
                                        });
                                    })
                                    .catch(err => {
                                        console.error('Error with bulk UserBalanceModele Transfer', err);
                                        return Utils.getJsonResponse('error', 201, '', 2, res);
                                    });
                                })
                                .catch(err => {
                                    console.error('Error with bulk MintModel Transfer', err);
                                    return Utils.getJsonResponse('error', 201, '', 3, res);
                                });
                        } else {
                            return Utils.getJsonResponse('error', 201, '', 4, res);
                        }
                    } else {
                        return Utils.getJsonResponse('error', 201, '', 5, res);
                    }
                } else {
                    return Utils.getJsonResponse('error', 201, '', 6, res);
                }
            })
            .catch(_ => {
                return Utils.getJsonResponse('error', 201, '', 7, res);
            });
        }             
    },
    getMintByHolder: (req, res)=> {
        const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return Utils.getErrors(res, errors);
            } else {
                Utils.checkAuthentication(req, res, jwt)
                .then(async _user => {
                    if (_user) {
                        
                        const { holderAddress } = req.query;
                        const results = await MintModel.aggregate([
                            {
                                $match: {
                                    to: holderAddress
                                }
                            },
                            {
                                $lookup: {
                                    from: 'deploys', // Assurez-vous que le nom de la collection correspond bien
                                    localField: 'tokenName',
                                    foreignField: 'name',
                                    as: 'deployInfo'
                                }
                            },
                            {
                                $unwind: '$deployInfo'
                            },
                            {
                                $project: {
                                    transactionHash: 1,
                                    to: 1,
                                    tokenName: 1,
                                    tokenAmount: 1,
                                    blockTime: 1,
                                    blockNumber: 1,
                                    logo: '$deployInfo.logo'
                                }
                            },
                            {
                                $sort: { blockTime: -1 } // Tri par holder (champ `to`)
                            }
                        ]);
                        return Utils.getJsonResponse('ok', 200, '', results, res);
                    } else {
                        return Utils.getJsonResponse('error', 200, '', '<p>The Solana blockchain is congested. Please try again later.</p>', res);
                    }
                })
                .catch(_ => {
                    return Utils.getJsonResponse('error', 200, '', '<p>The Solana blockchain is congested. Please try again later.</p>', res);
                });
            }
    },
    getStatistic: (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return Utils.getErrors(res, errors);
        } else {
            Utils.checkAuthentication(req, res, jwt)
            .then(async _user => {
                if (_user) {
                        const countMint = await MintModel.countDocuments();
                        const countProject = await DeployModel.countDocuments();
                        const countTransfer = await TransferModel.countDocuments();
                        const countSol = 0.0003 * countMint;
                        
                        const data = {
                            countMint : countMint,
                            countProject : countProject,
                            countTransfer : countTransfer,
                            countSol : countSol,
                        };
                    return Utils.getJsonResponse('ok', 200, '', data, res);
                } else {
                    return Utils.getJsonResponse('error', 200, '', 'The Solana blockchain is congested. Please try again later.', res);
                }
            })
            .catch(_ => {
                return Utils.getJsonResponse('error', 200, '', 'The Solana blockchain is congested. Please try again later.', res);
            });
        }
      


    
    }

}


module.exports.validate = (method) => {
    switch (method) {
        case 'mintSave': {
            return [
                body('tick', "<p>tick parameter does not exist</p>").exists(),
                body('tick', "<p>tick parameter must not be empty</p>").trim().not().isEmpty(),
                body('tick', "<p>Your project don't exist</p>").trim().custom(value => {
                    return new Promise(async (resolve, reject) => {
                        const tokenInfo = await DeployModel.findOne({ name: value}).lean();
                        if (tokenInfo) {
                            return resolve();
                        } else {
                            return reject();
                        }
                    })
                }),

                body('from', "<p>from parameter does not exist</p>").exists(),
                body('from', "<p>from parameter must not be empty</p>").trim().not().isEmpty(),

                body('signature', "<p>signature parameter does not exist</p>").exists(),
                body('signature', "<p>signature parameter must not be empty</p>").trim().not().isEmpty(),
                body('signature', "<p>Your signature is not valid</p>").trim().custom(value => {
                    return new Promise(async (resolve, reject) => {
                        const signatureInfo = await MintModel.findOne({ transactionHash: value}).lean();
                        if (signatureInfo) {
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