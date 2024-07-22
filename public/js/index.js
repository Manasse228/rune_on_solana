

import { Buffer } from 'buffer';
window.Buffer = window.Buffer || Buffer;

import { disconnectButton, balanceSpan, publicKeySpan, walletInfo } from './library/barMenu';
import { Notification } from './library/Notyf';
const notyf = Notification();

import { getConnection, checkNetwork } from './library/Transaction';
const connexion = getConnection();

document.addEventListener('DOMContentLoaded', async () => {

  let wallet;
  const connectWalletButton = document.getElementById('connect-wallet');

  const countMint = document.getElementById('countMint');
  const countTransfer = document.getElementById('countTransfer');
  const countProject = document.getElementById('countProject');
  const countFund = document.getElementById('countFund');

  const response = await fetch(`/api/statistic`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  const result = await response.json();
console.log(result)
  countMint.innerHTML = result.countMint.toLocaleString('en-US');
  countTransfer.innerHTML = result.countTransfer.toLocaleString('en-US');
  countProject.innerHTML = result.countProject.toLocaleString('en-US');
  countFund.innerHTML = result.countSol.toLocaleString('en-US');

  disconnectButton.addEventListener('click', () => {
    wallet.disconnect();
    walletInfo.style.display = 'none';
    connectWalletButton.style.display = 'block';
  });

  // Maintain connection on page reload
  if (window.solana && !window.solana.isConnected) {
    wallet = window.solana;
    await wallet.connect();
    checkNetwork(wallet, connexion, publicKeySpan, balanceSpan, walletInfo);
    connectWalletButton.style.display = 'none';
  } 


  connectWalletButton.addEventListener('click', async () => {
    try {
      if (!window.solana) {
        notyf.error('Please install a Phantom wallet extension');
        return;
      }

      wallet = window.solana;
      await wallet.connect();

      checkNetwork(wallet, connexion, publicKeySpan, balanceSpan, walletInfo);
      connectWalletButton.style.display = 'none';

    } catch (error) {
      notyf.error(`Connection error: ${error.message}`);
    }
  });

  
});

