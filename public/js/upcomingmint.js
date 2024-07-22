

import { disconnectButton, balanceSpan, publicKeySpan, walletInfo } from './library/barMenu';

import { getConnection, checkNetwork } from './library/Transaction';
const connexion = getConnection();
  
document.addEventListener('DOMContentLoaded', async () => {

  let wallet;

  disconnectButton.addEventListener('click', () => {
    wallet.disconnect();
    walletInfo.style.display = 'none';
    window.location.href = 'index.html';
  });

  
  // Maintain connection on page reload
  if (window.solana && !window.solana.isConnected) {
    wallet = window.solana;
    await wallet.connect();
    checkNetwork(wallet, connexion, publicKeySpan, balanceSpan, walletInfo);
  } else {
    window.location.href = 'index.html';
  }

});
  
  
  
  