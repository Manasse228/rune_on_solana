

import {transact, Web3MobileWallet} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

export const APP_IDENTITY = {
  name: 'React Native dApp',
  uri:  'http://192.168.1.68:3000/rune'
};

const authorizationResult = await transact(async (wallet) => {
    const authorizationResult = await wallet.authorize({
        cluster: 'solana:devnet',
        identity: APP_IDENTITY,
    });

    /* After approval, signing requests are available in the session. */

    return authorizationResult;
});

console.log("Connected to: " + authorizationResult.accounts[0].address)