
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  sendAndConfirmTransaction
} from '@solana/web3.js';



document.addEventListener('DOMContentLoaded', async () => {
  const disconnectButton = document.getElementById('disconnect');
  const walletInfo = document.getElementById('wallet-info');
  const publicKeySpan = document.getElementById('public-key');
  const balanceSpan = document.getElementById('balance');

  const currentPath = window.location.pathname.split('/').pop();
      const navbarItems = document.querySelectorAll('#navbarNavItems .nav-link');

      navbarItems.forEach(item => {
        console.log('item.getAttribute ', item.getAttribute('href'))
        if (item.getAttribute('href') === '/'.currentPath) {
          item.classList.add('active');
        }
      });
  

  let wallet;
  const rpcEndpoint = 'https://solana-mainnet.core.chainstack.com/8c40d3506bbc7b836ec2617aebfd33cc';
  const connection = new Connection(rpcEndpoint);
  const truncatePublicKey = (publicKey) => {

    return `${publicKey.slice(0, 6)}...${publicKey.slice(-3)}`;
  };

  const checkNetwork = async () => {
    if (wallet.isConnected) {
      const publicKey = new PublicKey(wallet.publicKey.toString());
      const balance = await connection.getBalance(publicKey);
      
      publicKeySpan.textContent = ` ${truncatePublicKey(publicKey.toString())}`;
      publicKeySpan.style.color = 'yellow';
      balanceSpan.textContent = ` ${(balance / 1e9).toFixed(3)} SOL`;
      balanceSpan.style.color = 'green';
      walletInfo.style.display = 'block';
    } else {
      window.location.href = 'index.html';
    }
  };

  disconnectButton.addEventListener('click', () => {
    wallet.disconnect();
    walletInfo.style.display = 'none';
    window.location.href = 'index.html';
  });



  // Maintain connection on page reload
  if (window.solana && !window.solana.isConnected) {
    wallet = window.solana;
    await wallet.connect();
    checkNetwork();
  } else {
    window.location.href = 'index.html';
  }


});



