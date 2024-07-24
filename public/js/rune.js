
import {
    Connection,
    clusterApiUrl,
    LAMPORTS_PER_SOL
} from '@solana/web3.js';
import {
    WalletAdapterNetwork
} from '@solana/wallet-adapter-base';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    LedgerWalletAdapter,
    TorusWalletAdapter,
    WalletConnectWalletAdapter,
} from '@solana/wallet-adapter-wallets';

import { Buffer } from 'buffer';
const rpcEndpoint = 'https://solana-mainnet.core.chainstack.com/8c40d3506bbc7b836ec2617aebfd33cc';
window.Buffer = window.Buffer || Buffer;

document.addEventListener('DOMContentLoaded', async () => {
    const connection = new Connection(rpcEndpoint);

    const wallets = {
        phantom: new PhantomWalletAdapter(),
        solflare: new SolflareWalletAdapter(),
        ledger: new LedgerWalletAdapter(),
        torus: new TorusWalletAdapter(),
        walletConnect: new WalletConnectWalletAdapter(),
    };

    const walletInfo = document.getElementById('wallet-info');
    const walletModal = document.getElementById('walletModal');

    document.getElementById('phantom_icon').src = wallets.phantom.icon;
    document.getElementById('solflare_icon').src = wallets.solflare.icon;
    document.getElementById('ledger_icon').src = wallets.ledger.icon;
    document.getElementById('torus_icon').src = wallets.torus.icon;
    document.getElementById('walletConnect_icon').src = wallets.walletConnect.icon;

    const updateWalletInfo = async (wallet) => {
        const publicKey = wallet.publicKey;
        const address = publicKey.toString();
        const balance = await connection.getBalance(publicKey);

        walletInfo.innerHTML = `
            <div class="alert alert-success">Wallet connected!</div>
            <div><strong>Address:</strong> <span class="wallet-address">${address}</span></div>
            <div><strong>Balance:</strong> <span class="wallet-balance">${balance / LAMPORTS_PER_SOL} SOL</span></div>
        `;
    };

    


    const connectWallet = async (wallet) => {
        console.log('wallet ', wallet)
        try {
            wallet.on('connect', async () => {
                await updateWalletInfo(wallet);
                // Close the modal (if using Bootstrap, uncomment the following line)
                // $(walletModal).modal('hide');
                console.log('Wallet connected:', wallet);
            });

            wallet.on('disconnect', () => {
                walletInfo.innerHTML = '<div class="alert alert-warning">Wallet disconnected.</div>';
            });

            await wallet.connect();
        } catch (error) {
            console.error('Error connecting wallet:', error);
        }
    };

    document.getElementById('connect-phantom').addEventListener('click', () => connectWallet(wallets.phantom));
    document.getElementById('connect-solflare').addEventListener('click', () => connectWallet(wallets.solflare));
    document.getElementById('connect-ledger').addEventListener('click', () => connectWallet(wallets.ledger));
    document.getElementById('connect-torus').addEventListener('click', () => connectWallet(wallets.torus)); 
    document.getElementById('connect-walletConnect').addEventListener('click', () => connectWallet(wallets.walletConnect)); 
});
