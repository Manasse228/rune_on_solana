const DeployModel = require('../models/Deploy');
const UserBalanceModel = require('../models/UserBalance');
const Utils = require('../config/Utils');
const solanaWeb3 = require('@solana/web3.js');
const {check, body, validationResult} = require('express-validator');
const jwt = require("jsonwebtoken");
const { PublicKey } = require("@solana/web3.js");
const nacl = require('tweetnacl');

const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'), 'confirmed');

module.exports = {

    getCurrentSlot: async () => {
        const currentSlot = await connection.getSlot('confirmed');
        return currentSlot;
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
            trxInfo.memo = memoData || false;
            trxInfo.instructions = parsedInstructions;

            return trxInfo;
        } catch (error) {
            console.error('Error fetching transaction details:', error.message);
            return trxInfo;
        }
    },
    pre_fix_check_addToken: (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return Utils.getErrors(res, errors);
        } else {
            Utils.checkAuthentication(req, res, jwt)
            .then(async _user => {
                if (_user) {
                    const { tick, max, lim, premine, logo } = req.body;
                    const errors = [];
                    const fix_totalSupply = Number(max);
                    const fix_mint = Number(lim);
                    const fix_premine = Number(premine);
            
                    const I = fix_totalSupply - (fix_totalSupply * (fix_premine / 100));
                    if ( !(I % fix_mint === 0)) {
                        errors.push('Token creation failed because the total supply for investors must be a multiple of the mint limit. Please adjust the total supply or the mint limit.');
                    }
                    return Utils.getJsonResponse('ok', 200, '', errors, res);
                } else {
                    return Utils.getJsonResponse('error', 500, '', ['The Solana blockchain is congested. Please try again later.'], res);
                }
            })
            .catch(_ => {
                return Utils.getJsonResponse('error', 500, '', ['The Solana blockchain is congested. Please try again later.'], res);
            });
        }
    },
    pre_fair_check_addToken: (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return Utils.getErrors(res, errors);
        } else {
            Utils.checkAuthentication(req, res, jwt)
            .then(async _user => {
                if (_user) {
                    const { tick, sb, eb, lim, premine, logo } = req.body;
                    const errors = [];
                    if (Number(sb) === Number(eb) || Number(sb) >= Number(eb) ) {
                        errors.push('<p>The Start Block Must must be greater than End Block</p>');
                    }
                    
                    const currentSlot = await connection.getSlot('confirmed');
                    if (Number(eb) <= currentSlot) {
                        errors.push('<p>The End Block must be greather than current block ('+currentSlot+')</p>');
                    }

                    return Utils.getJsonResponse('ok', 200, '', errors, res);
                } else {
                    return Utils.getJsonResponse('error', 500, '', ['The Solana blockchain is congested. Please try again later.'], res);
                }
            })
            .catch(_ => {
                return Utils.getJsonResponse('error', 500, '', ['The Solana blockchain is congested. Please try again later.'], res);
            });
        }
    },
    fix_save_addToken: (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return Utils.getErrors(res, errors);
        } else {
            Utils.checkAuthentication(req, res, jwt)
            .then(async _user => {
                if (_user) {

                    const errors = [];
                    const { transactionHash, description, twitterlink, logo } = req.body;
                    const trxDetails = await module.exports.getTransactionDetailsAndActions(transactionHash);

                    if (trxDetails !== null && trxDetails.from && trxDetails.memo) {

                        const senderAddress = trxDetails.from;
                        const toAddress = trxDetails.to;
                        const blocktime = trxDetails.blocktime;
                        const blocknumber = trxDetails.blocknumber;
                        const transactionMemo = JSON.parse(trxDetails.memo);

                        const tokenData = await DeployModel.getTokenByName(transactionMemo.tick);
                        const fix_totalSupply = Number(transactionMemo.max);
                        const fix_mint = Number(transactionMemo.lim);
                        const fix_premine = Number(transactionMemo.premine);

                        if (tokenData) {
                            errors.push('<p>Token name already exists</p>');
                        }

                        // Vérifier que la valeur de "tick" respecte le regex /^[a-zA-Z0-9]+$/
                        const tickRegex = /^[a-zA-Z0-9]+$/;
                        if (!tickRegex.test(transactionMemo.tick)) {
                            errors.push('<p>Token name must be a single word without spaces and special character</p>');
                        }

                        if (fix_totalSupply <= 0) {
                            errors.push('<p>Total Supply must be greater than Zero (0)</p>');
                        }

                        if (fix_mint <= 0) {
                            errors.push('<p>The Mint value must be greater than Zero (0)</p>');
                        }

                        if (fix_premine < 0 || fix_premine > 5) {
                            errors.push('<p>Premine must be between 0 and 5 inclusive</p>');
                        }

                        const I = fix_totalSupply - (fix_totalSupply * (fix_premine / 100));
                        if ( !(I % fix_mint === 0)) {
                            errors.push('<p>Token creation failed: The total supply for investors must be a multiple of the mint limit. Please adjust the total supply or the mint limit.</p>');
                        }

                        if (errors.length >0) {
                            return Utils.getJsonResponse('ok', 201, '', errors, res);
                        } else {
                            const deployModel = new DeployModel();
                            deployModel.blockNumber = Number(blocknumber);
                            deployModel.blockTime = Number(blocktime);
                            deployModel.transactionHash = transactionHash;
                            deployModel.from = senderAddress;
                            deployModel.to = toAddress;
                            deployModel.name = transactionMemo.tick;
                            deployModel.max = fix_totalSupply;
                            deployModel.lim = fix_mint;
                            deployModel.premine = fix_premine;
                            deployModel.description = description.trim();
                            deployModel.twitterlink = twitterlink.trim();
                            deployModel.logo = logo; 
                            deployModel.remain = Number(fix_totalSupply) - ((Number(fix_totalSupply) * Number(fix_premine))/100);
                            deployModel.save()
                                .then((_) => {
                                    return Utils.getJsonResponse('ok', 200, '', errors, res);
                                })
                                .catch(err => {
                                    return Utils.getJsonResponse('error', 500, '', ['The Solana blockchain is congested. Please try again later.'], res);
                                });    
                        }
                    } else {
                        return Utils.getJsonResponse('ok', 201, '', 'Your blockchain transaction is not valid.', res);
                    }
                } else {
                    return Utils.getJsonResponse('error', 500, '', ['The Solana blockchain is congested. Please try again later.'], res);
                }
            })
            .catch(_ => {
                console.log(_)
                return Utils.getJsonResponse('error', 500, '', ['The Solana blockchain is congested. Please try again later.'], res);
            });
        }
    },
    fair_save_addToken: (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return Utils.getErrors(res, errors);
        } else {
            Utils.checkAuthentication(req, res, jwt)
            .then(async _user => {
                if (_user) {
                    const errors = [];
                    const { transactionHash, description, twitterlink, logo } = req.body;
                    const trxDetails = await module.exports.getTransactionDetailsAndActions(transactionHash);

                    if (trxDetails !== null && trxDetails.from && trxDetails.memo) {

                        const senderAddress = trxDetails.from;
                        const toAddress = trxDetails.to;
                        const blocktime = trxDetails.blocktime;
                        const blocknumber = trxDetails.blocknumber;
                        const transactionMemo = JSON.parse(trxDetails.memo);

                        const tokenData = await DeployModel.getTokenByName(transactionMemo.tick);
                        const sb = Number(transactionMemo.sb);
                        const eb = Number(transactionMemo.eb);
                        const fair_mint = Number(transactionMemo.lim);
                        const fair_premine = Number(transactionMemo.premine);

                        if (tokenData) {
                            errors.push('<p>Token name already exists</p>');
                        }
        
                        const logoresult = await DeployModel.chekLogoLink(logo);
                        if (logoresult) {
                            errors.push('<p>This logo already exists</p>');
                        }
                    
                        const tickRegex = /^[a-zA-Z0-9]+$/;
                        if (!tickRegex.test(transactionMemo.tick)) {
                            errors.push('<p>Token name must be a single word without spaces and special character</p>');
                        }
                    
                        if (Number(sb) <= 0) {
                            errors.push('<p>Start Block must be greater than Zero (0)</p>');
                        }
        
                        if (Number(eb) <= 0) {
                            errors.push('<p>End Block must be greater than Zero (0)</p>');
                        }
                    
                        // Vérifier que la valeur de "lim" est > 0
                        if (fair_mint <= 0) {
                            errors.push('<p>The Mint value must be greater than Zero (0)</p>');
                        }
                    
                        if (Number(sb) === Number(eb) || Number(sb) >= Number(eb) ) {
                            errors.push('<p>The Start Block Must must be greater than End Block</p>');
                        }
                
                        // Vérifier que la valeur de "premine" est comprise entre 0 et 5
                        if (fair_premine < 0 || fair_premine > 5) {
                            errors.push('<p>Premine must be between 0 and 5 inclusive</p>');
                        }
                        
                        const currentSlot = await connection.getSlot('confirmed');
                        if (Number(eb) <= currentSlot) {
                            errors.push('<p>The End Block must be greather than current block ('+currentSlot+')</p>');
                        }

                        if (errors.length >0) {
                            return Utils.getJsonResponse('ok', 201, '', errors, res);
                        } else {
                            const deployModel = new DeployModel();
                            deployModel.blockNumber = Number(blocknumber);
                            deployModel.blockTime = Number(blocktime);
                            deployModel.transactionHash = transactionHash;
                            deployModel.from = senderAddress;
                            deployModel.to = toAddress;
                            deployModel.name = transactionMemo.tick;
                            deployModel.startBlock = Number(sb);
                            deployModel.endBlock = Number(eb);
                            deployModel.lim = Number(fair_mint);
                            deployModel.premine = Number(fair_premine);
                            deployModel.description = description.trim();
                            deployModel.twitterlink = twitterlink.trim();
                            deployModel.logo = logo; 
                            deployModel.save()
                                .then((_) => {
                                    return Utils.getJsonResponse('ok', 200, '', errors, res);
                                })
                                .catch(err => {
                                    return Utils.getJsonResponse('error', 200, '', ['<p>The Solana blockchain is congested. Please try again later.</p>'], res);
                                });
                        }
                    } else {
                        return Utils.getJsonResponse('ok', 201, '', '<p>Your blockchain transaction is not valid.</p>', res);
                    }
                } else {
                    return Utils.getJsonResponse('error', 200, '', ['<p>The Solana blockchain is congested. Please try again later.</p>'], res);
                }
            })
            .catch(_ => {
                return Utils.getJsonResponse('error', 200, '', ['<p>The Solana blockchain is congested. Please try again later.</p>'], res);
            });
        }
    },
    calculateFixProgress: (deploy) => {
        const i = (deploy.remain / deploy.max) * 100;
        return 100 - i;
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
    myDeployToken: (req, res)  => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return Utils.getErrors(res, errors);
        } else {
            Utils.checkAuthentication(req, res, jwt)
            .then(async _user => {
                if (_user) {
                    const { from } = req.query;

                    module.exports.getCurrentSlot()
                    .then(async currentBlock => {
                        try {
                            const results = await DeployModel.find({ from: from }).lean();
                            let response = await Promise.all(results.map(async (myDeploy) => {
                                return {
                                    logo: myDeploy.logo,
                                    name: myDeploy.name,
                                    max: myDeploy.max,
                                    lim: myDeploy.max,
                                    premine: myDeploy.premine, 
                                    mintOver: myDeploy.mintOver,
                                    alreadyPremine: myDeploy.alreadyPremine,
                                    blockNumber: myDeploy.blockNumber,
                                    blockTime: myDeploy.blockTime,
                                    premineHash: myDeploy.premineHash,
                                    transactionHash: myDeploy.transactionHash,
                                    description: myDeploy.description,
                                    twitterlink: myDeploy.twitterlink,
                                    progress: (Number(myDeploy.startBlock) >0) ? module.exports.calculateMintProgress(myDeploy.startBlock, myDeploy.endBlock, currentBlock).toFixed(2) : module.exports.calculateFixProgress(myDeploy)
                                };
                            }));
                            return Utils.getJsonResponse('ok', 200, '', response, res);
                        } catch (error) {
                            console.error(error);
                            return Utils.getJsonResponse('error', 200, '', ['<p>The Solana blockchain is congested. Please try again later.</p>'], res);
                        }
                    })
                    .catch(_ => {
                        return Utils.getJsonResponse('error', 200, '', ['<p>The Solana blockchain is congested. Please try again later.</p>'], res);
                    });   
                } else {
                    return Utils.getJsonResponse('error', 200, '', ['<p>The Solana blockchain is congested. Please try again later.</p>'], res);
                }
            })
            .catch(_ => {
                return Utils.getJsonResponse('error', 200, '', ['<p>The Solana blockchain is congested. Please try again later.</p>'], res);
            });
        }
    },
    updateDeployToken: (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return Utils.getErrors(res, errors);
        } else {
            Utils.checkAuthentication(req, res, jwt)
            .then(async _user => {
                if (_user) {
                    const { owner, tokenName, twitterlink, description, signedMessage } = req.body;
                    const errors = [];
                    const tokenInfo = await DeployModel.find({ from: owner, name: tokenName}).lean();

                    if (!tokenInfo) {
                        errors.push('<p>Your are not the Owner of this token</p>'); 
                    } else {

                        // Verify the signature
                        const verifyMessage = {
                            owner: owner,
                            tokenName: tokenName,
                            twitterlink: twitterlink,
                            description: description
                        };
                        
                        // Convert verifyMessage to a JSON string and then to a Uint8Array
                        const verifyMessageBuffer = new Uint8Array(Buffer.from(JSON.stringify(verifyMessage)));

                        // Convert signedMessage back to a Uint8Array from hex string
                        const signedMessageBuffer = new Uint8Array(Buffer.from(signedMessage, 'hex'));
                        
                        // Create a PublicKey object from the owner's public key
                        const publicKey = new PublicKey(owner.toString());
                        
                        // Verify the signature
                        const isVerified = nacl.sign.detached.verify(
                            verifyMessageBuffer,
                            signedMessageBuffer,
                            publicKey.toBuffer()
                        );

                        if (!isVerified) {
                            errors.push('<p>Your are not the Owner of this token because your signature is corrupt</p>'); 
                            return Utils.getJsonResponse('error', 201, '', errors, res);
                        }

                        await DeployModel.updateMany(
                            { from: owner, name: tokenName },
                            { $set: { twitterlink: twitterlink.trim(), description: description } }
                        );
                        return Utils.getJsonResponse('ok', 200, '', errors, res);
                    }
                    return Utils.getJsonResponse('error', 201, '', errors, res);
                } else {
                    return Utils.getJsonResponse('error', 201, '', ['<p>The Solana blockchain is congested. Please try again later1.</p>'], res);
                }
            })
            .catch(_ => {
                console.log(_)
                return Utils.getJsonResponse('error', 201, '', ['<p>The Solana blockchain is congested. Please try again later2.</p>'], res);
            });
        }
    },
    claimDeployToken: (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return Utils.getErrors(res, errors);
        } else {
            Utils.checkAuthentication(req, res, jwt)
            .then(async _user => {
                if (_user) {
                    const errors = [];
                    const { owner, tokenName, transaction } = req.body;
                    const tokenInfo = await DeployModel.findOne({ to: owner, name: tokenName}).lean();

                    if (tokenInfo.mintOver && !tokenInfo.alreadyPremine && tokenInfo.premineHash === '' && Number(tokenInfo.premine) >= 1) {

                        const trxDetails = await module.exports.getTransactionDetailsAndActions(transaction);
            
                        const fromDetails = trxDetails.from;
                        const to = trxDetails.to;
                        const blocktime = trxDetails.blocktime;
                        const blocknumber = trxDetails.blocknumber;
                        const transactionMemo = JSON.parse(trxDetails.memo);
                        const premineAmount = Number((tokenInfo.max * tokenInfo.premine)/100);

                        if (
                            (Number(blocknumber) > Number(tokenInfo.blockNumber)) && 
                            (tokenInfo.to === fromDetails) && 
                            (tokenInfo.name === transactionMemo.tick) && 
                            Number(transactionMemo.amount) == premineAmount &&
                            Object.keys(trxDetails.memo).length > 0
                        ) {
                            
                            const session = await DeployModel.startSession();
                            try {
                                session.startTransaction();

                                const operationsDeploy =  {
                                    updateOne: {
                                        filter: {
                                            to: fromDetails,
                                            name: transactionMemo.tick,
                                        },
                                        update: {
                                            $set: {
                                                alreadyPremine: true,
                                                premineHash: transaction
                                            }
                                        }
                                    }
                                };

                                const operationsAddBalance =  {
                                    updateOne: {
                                        filter: {
                                            address: to,
                                            tokenName: transactionMemo.tick,
                                        },
                                        update: {
                                            $inc: {
                                                balance: Number(transactionMemo.amount),
                                            }
                                        },
                                        upsert: true
                                    }
                                };                            

                                await DeployModel.bulkWrite([operationsDeploy], { session });
                                await UserBalanceModel.bulkWrite([operationsAddBalance], { session });

                                await session.commitTransaction();
                                session.endSession();
                                
                                return Utils.getJsonResponse('error', 200, '', errors, res);
                            } catch (err) {
                                await session.abortTransaction();
                                session.endSession();
            
                                errors.push('<p>Error during your balance update. Contact Admin</p>');
                                return Utils.getJsonResponse('error', 201, '', errors, res);
                            }
                        } else {
                            errors.push('<p>Your claim is not valid. Try again</p>');
                            return Utils.getJsonResponse('error', 201, '', errors, res);
                        }
                    } else {
                        errors.push('<p>Claiming this token is no longer possible because it has already been done.</p>');
                        return Utils.getJsonResponse('error', 201, '', errors, res);
                    }
                } else {
                    return Utils.getJsonResponse('error', 201, '', ['<p>The Solana blockchain is congested. Please try again later.</p>'], res);
                }
            })
            .catch(_ => {
                return Utils.getJsonResponse('error', 201, '', ['<p>The Solana blockchain is congested. Please try again later.</p>'], res);
            });
        } 
    }

}

module.exports.validate = (method) => {
    switch (method) {
        case 'claim': {
            return [
                body('tokenName', "<p>tokenName parameter does not exist</p>").exists(),
                body('tokenName', "<p>tokenName parameter must not be empty</p>").trim().not().isEmpty(),
                body('tokenName', "<p>Token name already exists</p>").trim().custom(value => {
                    return new Promise(async (resolve, reject) => {
                        const tokenInfo = await DeployModel.findOne({ name: value}).lean();
                        if (tokenInfo) {
                            return resolve();
                        } else {
                            return reject();
                        }
                    })
                }),

                body('owner', "<p>owner parameter does not exist</p>").exists(),
                body('owner', "<p>The Owner are mandatory</p>").trim().not().isEmpty(),

                body('transaction', "<p>transaction parameter does not exist</p>").exists(),
                body('transaction', "<p>Don't forget to put your transaction</p>").trim().not().isEmpty(),
            ]
        }
        case 'updateDeploy': { 
            return [
                body('tokenName', "<p>tokenName parameter does not exist</p>").exists(),
                body('tokenName', "<p>tokenName parameter must not be empty</p>").trim().not().isEmpty(),
                body('tokenName', "<p>Your project don't exist</p>").trim().custom(value => {
                    return new Promise(async (resolve, reject) => {
                        const tokenInfo = await DeployModel.findOne({ name: value}).lean();
                        if (tokenInfo) {
                            return resolve();
                        } else {
                            return reject();
                        }
                    })
                }),

                body('owner', "<p>owner parameter does not exist</p>").exists(),
                body('owner', "<p>The Owner are mandatory</p>").trim().not().isEmpty(),

                body('signedMessage', "<p>signedMessage parameter does not exist</p>").exists(),

                body('twitterlink', "<p>twitterlink parameter does not exist</p>").exists(),
                body('twitterlink', "<p>Don't forget to set your Twitter project page</p>").trim().not().isEmpty(),

                body('description', "<p>description parameter does not exist</p>").exists(),
                body('description', "<p>Don't forget to set your project's description</p>").trim().not().isEmpty(),
            ]
        }
        case 'myDeploy': {
            return [
                check('from', "<p>from parameter does not exist</p>").exists(),
                check('from', "<p>from parameter must not be empty</p>").trim().not().isEmpty(),
            ]
        }
        case 'pre_fix_check_addToken': { 
            return [
                body('tick', "tick parameter does not exist").exists(),
                body('tick', "tick parameter must not be empty").trim().not().isEmpty(),
                body('tick', "Project's name already exist").trim().custom(value => {
                    return new Promise(async (resolve, reject) => {
                        const tokenInfo = await DeployModel.findOne({ name: value}).lean();
                        if (tokenInfo) {
                            return reject();
                        } else {
                            return resolve();
                        }
                    })
                }),
                body('tick', "Token name must be a single word without spaces and special character").trim().custom(value => {
                    return new Promise(async (resolve, reject) => {
                        const tickRegex = /^[a-zA-Z0-9]+$/;                        
                        if (!tickRegex.test(value)) {
                            return reject();
                        } else {
                            return resolve();
                        }
                    })
                }),

                body('logo', "logo parameter does not exist").exists(),
                body('logo', "logo parameter must not be empty").trim().not().isEmpty(),
                body('logo', "This logo already exists").trim().custom(value => {
                    return new Promise(async (resolve, reject) => {
                        const tokenInfo = await DeployModel.findOne({ logo: value}).lean();
                        if (tokenInfo) {
                            return reject();
                        } else {
                            return resolve();
                        }
                    })
                }),

                body('max', "The max parameter does not exist").exists(),
                body('max', "The max must not be empty").trim().not().isEmpty(),
                body('max', "The max must be a number").trim().isInt(),
                body('max', "Total Supply must be greater than Zero (0)").trim().custom(value => {
                    return new Promise((resolve, reject) => {
                        if (value && value >= 1) {
                            return resolve();
                        } else {
                            return reject();
                        }
                    })
                }),

                body('lim', "The lim parameter does not exist").exists(),
                body('lim', "The lim must not be empty").trim().not().isEmpty(),
                body('lim', "The lim must be a number").trim().isInt(),
                body('lim', "The Mint value must be greater than Zero (0)").trim().custom(value => {
                    return new Promise((resolve, reject) => {
                        if (value && value >= 1) {
                            return resolve();
                        } else {
                            return reject();
                        }
                    })
                }),

                body('premine', "The premine parameter does not exist<").exists(),
                body('premine', "The premine must not be empty").trim().not().isEmpty(),
                body('premine', "The premine must be a number").trim().isInt(),
                body('premine', "Premine must be between 0 and 5 inclusive").trim().custom(value => {
                    return new Promise((resolve, reject) => {
                        if (value && (value <0 || value >5)) {
                            return reject();
                        } else {
                            return resolve();
                        }
                    })
                }),
            ]
        }
        case 'pre_fair_check_addToken': { 
            return [
                body('tick', "tick parameter does not exist").exists(),
                body('tick', "tick parameter must not be empty").trim().not().isEmpty(),
                body('tick', "Project's name already exist").trim().custom(value => {
                    return new Promise(async (resolve, reject) => {
                        const tokenInfo = await DeployModel.findOne({ name: value}).lean();
                        if (tokenInfo) {
                            return reject();
                        } else {
                            return resolve();
                        }
                    })
                }),
                body('tick', "Token name must be a single word without spaces and special character<").trim().custom(value => {
                    return new Promise(async (resolve, reject) => {
                        const tickRegex = /^[a-zA-Z0-9]+$/;                        
                        if (!tickRegex.test(value)) {
                            return reject();
                        } else {
                            return resolve();
                        }
                    })
                }),


                body('lim', "The lim parameter does not exist").exists(),
                body('lim', "The lim must not be empty").trim().not().isEmpty(),
                body('lim', "The lim must be a number").trim().isInt(),
                body('lim', "The Mint value must be greater than Zero (0)").trim().custom(value => {
                    return new Promise((resolve, reject) => {
                        if (value && value >= 1) {
                            return resolve();
                        } else {
                            return reject();
                        }
                    })
                }),

                body('premine', "The premine parameter does not exist").exists(),
                body('premine', "The premine must not be empty").trim().not().isEmpty(),
                body('premine', "The premine must be a number").trim().isInt(),
                body('premine', "Premine must be between 0 and 5 inclusive").trim().custom(value => {
                    return new Promise((resolve, reject) => {
                        if (value && (value <0 || value >5)) {
                            return reject();
                        } else {
                            return resolve();
                        }
                    })
                }),

                body('logo', "logo parameter does not exist").exists(),
                body('logo', "logo parameter must not be empty").trim().not().isEmpty(),
                body('logo', "This logo already exists").trim().custom(value => {
                    return new Promise(async (resolve, reject) => {
                        const tokenInfo = await DeployModel.findOne({ logo: value}).lean();
                        if (tokenInfo) {
                            return reject();
                        } else {
                            return resolve();
                        }
                    })
                }),

                body('sb', "The sb parameter does not exist").exists(),
                body('sb', "The sb must not be empty").trim().not().isEmpty(),
                body('sb', "The sb must be a number").trim().isInt(),
                body('sb', "Start Block must be greater than Zero (0)").trim().custom(value => {
                    return new Promise((resolve, reject) => {
                        if (value && value >= 1) {
                            return resolve();
                        } else {
                            return reject();
                        }
                    })
                }),

                body('eb', "The lim parameter does not exist").exists(),
                body('eb', "The lim must not be empty").trim().not().isEmpty(),
                body('eb', "The lim must be a number").trim().isInt(),
                body('eb', "End Block must be greater than Zero (0)").trim().custom(value => {
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
        case 'save_addToken': { 
            return [
                body('logo', "logo parameter does not exist").exists(),
                body('logo', "logo parameter must not be empty").trim().not().isEmpty(),
                body('logo', "This logo already exists").trim().custom(value => {
                    return new Promise(async (resolve, reject) => {
                        const tokenInfo = await DeployModel.findOne({ logo: value}).lean();
                        if (tokenInfo) {
                            return reject();
                        } else {
                            return resolve();
                        }
                    })
                }),
                body('transactionHash', "transactionHash parameter does not exist").exists(),
                body('transactionHash', "Don't forget to put your transaction's hash").trim().not().isEmpty(),
            ]
        }
        default : {

        }
    }
}

