
import {
    Connection,
    clusterApiUrl,
    PublicKey,
    Transaction,
    TransactionInstruction,
    SystemProgram,
    sendAndConfirmTransaction
  } from '@solana/web3.js';

  const MEMO_PROGRAM_ID = new PublicKey(process.env.MEMO_PROGRAM_ID);

    export function getConnection() {
        const rpcEndpoint = process.env.RPC_END_POINT;
        const connection = new Connection(rpcEndpoint);
        return connection;
    }

    export function truncatePublicKey(publicKey) {
        return `${publicKey.slice(0, 6)}...${publicKey.slice(-5)}`;
    }

    export async function CreateTransaction(fromWallet, toAddress, data, connection) {
        const toPublicKey = new PublicKey(toAddress);

        const instruction = new TransactionInstruction({
        keys: [{ pubkey: fromWallet.publicKey, isSigner: true, isWritable: true }],
        programId: MEMO_PROGRAM_ID, // Normally this would be a specific program ID
        data: Buffer.from(data), // Custom data
        });

        const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: fromWallet.publicKey,
            toPubkey: toPublicKey,
            lamports: 0.00000001 * 1e9, // Example amount in lamports (1 SOL = 1e9 lamports)
        }),
        instruction
        );

        const { blockhash } = await connection.getRecentBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = fromWallet.publicKey;

        return transaction;
    };

    export async function SimulateTransaction (transaction, connection) {
        try {
        const simulationResult = await connection.simulateTransaction(transaction);
        console.log('Simulation result:', simulationResult);
    
        if (simulationResult.value.err) {
            console.error('Simulation error:', simulationResult.value.err);
            return false;
        } else {
            return true;
        }
        } catch (error) {
        console.error('Simulation failed:', error);
        return false;
        }
    };

    export async function WaitForConfirmations (connection, signature) {
        let confirmedTransaction = null;
    
        // Polling mechanism to wait for the desired number of confirmations
        for (let attempt = 0; attempt < 20; attempt++) { // Maximum 20 attempts
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 3 seconds between each attempt
    
            confirmedTransaction = await connection.getTransaction(signature, {
                maxSupportedTransactionVersion: 0,
            });
    
            if (confirmedTransaction && confirmedTransaction.slot > 0) {
                return confirmedTransaction;
            }
        }
    
        return null;
    };

    export async function checkNetwork (wallet, connexion, publicKeySpan, balanceSpan, walletInfo) {
        if (wallet.isConnected) {
        const publicKey = new PublicKey(wallet.publicKey.toString());
        const balance = await connexion.getBalance(publicKey);
        
        publicKeySpan.textContent = ` ${truncatePublicKey(publicKey.toString())}`;
        publicKeySpan.style.color = 'yellow';
        balanceSpan.textContent = ` ${(balance / 1e9).toFixed(3)} SOL`;
        balanceSpan.style.color = 'green';
        walletInfo.style.display = 'block';
        } else {
        window.location.href = 'index.html';
        }
    };