
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
    LedgerWalletAdapter
} from '@solana/wallet-adapter-wallets';

import { Buffer } from 'buffer';
const rpcEndpoint = 'https://solana-mainnet.core.chainstack.com/8c40d3506bbc7b836ec2617aebfd33cc';
window.Buffer = window.Buffer || Buffer;

document.addEventListener('DOMContentLoaded', async () => {
    const connection = new Connection(rpcEndpoint);

    const wallets = {
        phantom: new PhantomWalletAdapter(),
        solflare: new SolflareWalletAdapter(),
        ledger: new LedgerWalletAdapter()
    };

    const walletInfo = document.getElementById('wallet-info');
    const walletModal = document.getElementById('walletModal');

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


        console.log(wallet)


        wallet.on('connect', async () => {

            await updateWalletInfo(wallet);

            walletModal.modal('hide'); // Close the modal
        });

        wallet.on('disconnect', () => {
            walletInfo.innerHTML = '<div class="alert alert-warning">Wallet disconnected.</div>';
        });

        await wallet.connect();
    };

    document.getElementById('connect-phantom').addEventListener('click', () => connectWallet(wallets.phantom));
    document.getElementById('connect-solflare').addEventListener('click', () => connectWallet(wallets.solflare));
    document.getElementById('connect-ledger').addEventListener('click', () => connectWallet(wallets.ledger));
});
