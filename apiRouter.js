const express = require('express');
const userCtrl = require('./router/UserCtrl');
const burnCtrl = require('./router/BurnCtrl');
const deployCtrl = require('./router/DeployCtrl');
const mintCtrl = require('./router/MintCtrl');
const tokenCtrl = require('./router/TokenCtrl');
const transferCtrl = require('./router/TransferCtrl');
const userBalanceCtrl = require('./router/UserBalanceCtrl');


exports.router = (function () {
    const apiRouter = express.Router();

    // Users routes
    apiRouter.route('/memefi/login').post(userCtrl.validate('login'), userCtrl.login);
    apiRouter.route('/memefi/createAdmin').post(userCtrl.createAdmin);



    /************************** Token Info **************************/
    apiRouter.route('/memefi/token/info').get(tokenCtrl.validate('tokenName'), tokenCtrl.getTokenInfo);
    apiRouter.route('/memefi/token/statistic').get(mintCtrl.getStatistic);


    /************************** User Balance **************************/
    apiRouter.route('/memefi/holders').get(userBalanceCtrl.validate('tokenName'), userBalanceCtrl.getHoldersList);
    apiRouter.route('/memefi/myasset').get(userBalanceCtrl.validate('holderAddress'), userBalanceCtrl.myAsset);


    /************************** Mint **************************/
    apiRouter.route('/memefi/mint/available').get(tokenCtrl.validate('tokenName'), tokenCtrl.mintAvailable);
    apiRouter.route('/memefi/mint/save').post(mintCtrl.validate('mintSave'), mintCtrl.saveMint);
    apiRouter.route('/memefi/mymints').get(mintCtrl.validate('holderAddress'), mintCtrl.getMintByHolder);

    apiRouter.route('/memefi/mint/upcoming').get(tokenCtrl.getUpComingMint);
    apiRouter.route('/memefi/mint/ongoing').get(tokenCtrl.getOnGoingMint);
    apiRouter.route('/memefi/mint/passed').get(tokenCtrl.getPassedMint);


    /************************** Burn **************************/
    apiRouter.route('/memefi/burn/check').get(burnCtrl.validate('checkBurn'), burnCtrl.checkBurn);
    apiRouter.route('/memefi/burn/save').post(burnCtrl.validate('saveBurn'), burnCtrl.saveBurn);
    apiRouter.route('/memefi/myburn').get(burnCtrl.validate('holderAddress'), burnCtrl.myBurnList);

    /************************** Transfer **************************/
    apiRouter.route('/memefi/transfer/check').get(transferCtrl.validate('checkTransfer'), transferCtrl.checkTransfer);
    apiRouter.route('/memefi/transfer/save').post(transferCtrl.validate('saveTransfer'), transferCtrl.saveTransfer);
    apiRouter.route('/memefi/mytransfer').get(transferCtrl.validate('holderAddress'), transferCtrl.myTransferList);

    /************************** Deploy **************************/
    apiRouter.route('/memefi/myDeploy').get(deployCtrl.validate('myDeploy'), deployCtrl.myDeployToken);
    apiRouter.route('/memefi/deploy/update').post(deployCtrl.validate('updateDeploy'), deployCtrl.updateDeployToken);
    apiRouter.route('/memefi/deploy/claim').post(deployCtrl.validate('claim'), deployCtrl.claimDeployToken);

    apiRouter.route('/memefi/fix/checkdeployToken').post(deployCtrl.validate('pre_fix_check_addToken'), deployCtrl.pre_fix_check_addToken);
    apiRouter.route('/memefi/fair/checkdeployToken').post(deployCtrl.validate('pre_fair_check_addToken'), deployCtrl.pre_fair_check_addToken);

    apiRouter.route('/memefi/fix/saveToken').post(deployCtrl.validate('save_addToken'), deployCtrl.fix_save_addToken);
    apiRouter.route('/memefi/fair/saveToken').post(deployCtrl.validate('save_addToken'), deployCtrl.fair_save_addToken);


    /************************** Airdrop **************************/
    

    return apiRouter;
})();

