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
    pre_fix_check_addToken: async (tokenName, totalSupply, mint, premine, logo) => {

        const errors = [];

        if (!tokenName || !totalSupply || Number(mint) <=0 || Number(premine) <0 || !logo) {
            errors.push("<p>The Token's name or TotalSupply or Mint value or Premine value or Logo can't be empty</p>");
            return errors;
        } else {
            const fix_totalSupply = Number(totalSupply);
            const fix_mint = Number(mint);
            const fix_premine = Number(premine);

            try {
                const result = await DeployModel.getTokenByName(tokenName);
                if (result) {
                    errors.push('<p>Token name already exists</p>');
                }

                const logoresult = await DeployModel.chekLogoLink(logo);
                if (logoresult) {
                    errors.push('<p>This logo already exists</p>');
                }
            
                // Vérifier que la valeur de "tick" respecte le regex /^[a-zA-Z0-9]+$/
                const tickRegex = /^[a-zA-Z0-9]+$/;
                if (!tickRegex.test(tokenName)) {
                    errors.push('<p>Token name must be a single word without spaces and special character</p>');
                }
            
                // Vérifier que la valeur de "max" est > 0
                if (fix_totalSupply <= 0) {
                    errors.push('<p>Total Supply must be greater than Zero (0)</p>');
                }
            
                // Vérifier que la valeur de "lim" est > 0
                if (fix_mint <= 0) {
                    errors.push('<p>The Mint value must be greater than Zero (0)</p>');
                }
            
                // Vérifier que la valeur de "premine" est comprise entre 0 et 5
                if (fix_premine < 0 || fix_premine > 5) {
                    errors.push('<p>Premine must be between 0 and 5 inclusive</p>');
                }
        
                const I = fix_totalSupply - (fix_totalSupply * (fix_premine / 100));
        
                if ( !(I % fix_mint === 0)) {
                    errors.push('<p>Token creation failed: The total supply for investors must be a multiple of the mint limit. Please adjust the total supply or the mint limit.</p>');
                }

                return errors;
            } catch (error) {
                errors.push('<p>Error fetching token by name: Contact Dev</p>');
                return errors;
            }  
        }
    },
    pre_fair_check_addToken: async (tokenName, sb, eb, mint, premine, logo) => {

        const errors = [];
        if (!tokenName || !sb || !eb || !mint || !premine || !logo) {
            errors.push("<p>The tokenName or Start Block or End Block or Mint value or Premine value or Logo can't be empty</p>");
            return errors;
        } else {
            const fix_mint = Number(mint);
            const fix_premine = Number(premine);

            try {
                const result = await DeployModel.getTokenByName(tokenName);
                if (result) {
                    errors.push('<p>Token name already exists</p>');
                }

                const logoresult = await DeployModel.chekLogoLink(logo);
                if (logoresult) {
                    errors.push('<p>This logo already exists</p>');
                }
            
                // Vérifier que la valeur de "tick" respecte le regex /^[a-zA-Z0-9]+$/
                const tickRegex = /^[a-zA-Z0-9]+$/;
                if (!tickRegex.test(tokenName)) {
                    errors.push('<p>Token name must be a single word without spaces and special character</p>');
                }
            
                if (Number(sb) <= 0) {
                    errors.push('<p>Start Block must be greater than Zero (0)</p>');
                }

                if (Number(eb) <= 0) {
                    errors.push('<p>End Block must be greater than Zero (0)</p>');
                }
            
                // Vérifier que la valeur de "lim" est > 0
                if (fix_mint <= 0) {
                    errors.push('<p>The Mint value must be greater than Zero (0)</p>');
                }
            
                if (Number(sb) === Number(eb) || Number(sb) >= Number(eb) ) {
                    errors.push('<p>The Start Block Must must be greater than End Block</p>');
                }
        
                // Vérifier que la valeur de "premine" est comprise entre 0 et 5
                if (fix_premine < 0 || fix_premine > 5) {
                    errors.push('<p>Premine must be between 0 and 5 inclusive</p>');
                }
                
                const currentSlot = await connection.getSlot('confirmed');
                if (Number(eb) <= currentSlot) {
                    errors.push('<p>The End Block must be greather than current block ('+currentSlot+')</p>');
                }
                    
                return errors;
            } catch (error) {
                errors.push('<p>Error fetching token by name: Contact Dev</p>');
                return errors;
            }
        }
    },
    fix_save_addToken: async (tokenName, totalSupply, mint, premine, from, to, transactionHash, blockNumber, blockTime, description, twitterlink, logo) => {
        return new Promise((resolve, reject) => {

            if (!tokenName || !totalSupply || !mint || !premine.toString() || !from || !to || !transactionHash || !blockNumber || !blockTime || !description || !twitterlink || !logo) {
                console.log(tokenName, totalSupply, mint, premine, from, to, transactionHash, blockNumber, blockTime, description, twitterlink, logo)
                resolve(false)
            } else {
                const deployModel = new DeployModel();
                deployModel.blockNumber = Number(blockNumber);
                deployModel.blockTime = Number(blockTime);
                deployModel.transactionHash = transactionHash;
                deployModel.from = from;
                deployModel.to = to;
                deployModel.name = tokenName.trim();
                deployModel.max = Number(totalSupply);
                deployModel.lim = Number(mint);
                deployModel.premine = Number(premine);
                deployModel.description = description.trim();
                deployModel.twitterlink = twitterlink.trim();
                deployModel.logo = logo; 
                deployModel.remain = Number(totalSupply) - ((Number(totalSupply) * Number(premine))/100);
                deployModel.save()
                    .then((_) => {
                        resolve(true)
                    })
                    .catch(err => {
                        resolve(false)
                    });
            }
        })
    },
    fair_save_addToken: async (tokenName, sb, eb, mint, premine, from, to, transactionHash, blockNumber, blockTime, description, twitterlink, logo) => {
        return new Promise((resolve, reject) => {

            if (!tokenName || !sb || !eb || !mint || !premine || !from || !to || !transactionHash || !blockNumber || !blockTime || !description || !twitterlink || !logo) {
                resolve(false)
            } else {
                const deployModel = new DeployModel();
                deployModel.blockNumber = Number(blockNumber);
                deployModel.blockTime = Number(blockTime);
                deployModel.transactionHash = transactionHash;
                deployModel.from = from;
                deployModel.to = to;
                deployModel.name = tokenName;
                deployModel.startBlock = Number(sb);
                deployModel.endBlock = Number(eb);
                deployModel.lim = Number(mint);
                deployModel.premine = Number(premine);
                deployModel.description = description;
                deployModel.twitterlink = twitterlink;
                deployModel.logo = logo; 
                deployModel.save()
                    .then((_) => {
                        resolve(true)
                    })
                    .catch(err => {
                        resolve(false)
                    });
            }
        })
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

                        if ((Number(blocknumber) > Number(tokenInfo.blockNumber)) && (tokenInfo.to === fromDetails) && (tokenInfo.name === transactionMemo.tick) && Number(transactionMemo.amount) == premineAmount) {
                            
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
        default : {

        }
    }
}