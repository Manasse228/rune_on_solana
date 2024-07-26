
import {
    PublicKey,
} from '@solana/web3.js';

import { Buffer } from 'buffer';
window.Buffer = window.Buffer || Buffer;

import { disconnectButton, balanceSpan, publicKeySpan, walletInfo } from './library/barMenu';
import { Notification } from './library/Notyf';
const notyf = Notification();

import { CreateTransaction, getConnection, WaitForConfirmations, checkNetwork } from './library/Transaction';
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

    const burnErrorNotification = document.getElementById('burnErrorNotification');
    burnErrorNotification.innerHTML = '';
    const burnDivMsg = document.getElementById('burnSuccessNotification_message');
    const burnAlert = document.getElementById('burnSuccessNotification');
    const burnButton = document.getElementById('burnButton');
    burnButton.addEventListener('click', async () => {

      const amount = Number(document.getElementById("tokenAmountForBurn").value);
      const senderAddress = wallet.publicKey.toString();
      const tokenName = document.getElementById("tokenNameIdBurn").value;

      const response = await fetch(`/memefi/burn/check?tokenName=${encodeURIComponent(tokenName)}&senderAddress=${encodeURIComponent(senderAddress)}&amount=${encodeURIComponent(amount)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${process.env.JWT_TOKEN}`
        }
      });
      const _result = await response.json();
      const result = _result.data;

      if (_result && _result.errorcode === 400 && _result.errortext) {
        notyf.error(_result.errortext);
        burnErrorNotification.innerHTML = _result.errortext;
        burnErrorNotification.style.display = 'block';
      }

      if ( (_result && _result.errorcode === 500) || (result && result.length > 0) ) {
        burnErrorNotification.innerHTML = result.join('');
        burnErrorNotification.style.display = 'block';
      }


      if ((_result && _result.errorcode === 200) && result && result.length === 0) {
        burnErrorNotification.style.display = 'none';

        const dataObject = {
            p: "fast-20",
            op: "burn",
            tick: tokenName.trim(),
            amt: amount
        };
        const data = `data:,${JSON.stringify(dataObject)}`;
        wallet = window.solana;
        await wallet.connect();
        const fromWallet = wallet;
        const publicKey = new PublicKey(senderAddress.toString());
        const transaction = await CreateTransaction(fromWallet, publicKey.toString(), data, connexion);

        const { signature } = await wallet.signAndSendTransaction(transaction);

        notyf.success('Your token burning is underway. Please wait');
        notyf.open({
          type: 'info',
          message: "Closing this page may interrupt the burning process"
        });

        const confirmedTransaction = await WaitForConfirmations(connexion, signature);

        const dataToSave = {
          from : senderAddress.toString(),
          signature : signature
        }

        const response = await fetch('/memefi/burn/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${process.env.JWT_TOKEN}`
          },
          body: JSON.stringify(dataToSave),
        });
        const _result = await response.json();

        burnAlert.removeAttribute('style');

        if (_result && _result.errorcode === 400 && _result.errortext) {
          notyf.error(_result.errortext);
          burnErrorNotification.innerHTML = _result.errortext;
          burnErrorNotification.style.display = 'block';
        }

        if (_result && _result.errorcode === 200 && _result.data) {
          burnErrorNotification.style.display = 'none';
          burnDivMsg.innerHTML = `<p>Token burned with success. <a target="_blank" href="https://solscan.io/tx/${signature}">Your transaction hash</a> </p>`;
          burnAlert.classList.remove('d-none');
          updateTable();
        } 
        
        if (_result && _result.errorcode === 201 && _result.data) {
          burnErrorNotification.innerHTML = _result.data.join('');
          burnErrorNotification.style.display = 'block';
        }
      }

    })
  

    const transferErrorNotification = document.getElementById('transferErrorNotification');
    transferErrorNotification.innerHTML = '';
    const transferDivMsg = document.getElementById('transferSuccessNotification_message');
    const transferAlert = document.getElementById('transferSuccessNotification');
    
    const transferButton = document.getElementById('transferButton');
    transferButton.addEventListener('click', async () => {

      const receiverAddress = document.getElementById("tokenReceiver").value;
      const amount = Number(document.getElementById("tokenAmount").value);
      const senderAddress = wallet.publicKey.toString();
      const tokenName = document.getElementById("tokenNameId").value;

      const response = await fetch(`/memefi/transfer/check?tokenName=${encodeURIComponent(tokenName)}&senderAddress=${encodeURIComponent(senderAddress)}&receiverAddress=${encodeURIComponent(receiverAddress)}&amount=${encodeURIComponent(amount)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${process.env.JWT_TOKEN}`
        }
      });
      const _result = await response.json();
      const result = _result.data;

      if (_result && _result.errorcode === 400 && _result.errortext) {
        notyf.error(_result.errortext);
        transferErrorNotification.innerHTML = _result.errortext;
        transferErrorNotification.style.display = 'block';
      }

      if ( (_result && _result.errorcode === 500) || (result && result.length > 0) ) {
        transferErrorNotification.innerHTML = result.join('');
        transferErrorNotification.style.display = 'block';
      }

      if ((_result && _result.errorcode === 200) && result && result.length === 0) {
        transferErrorNotification.style.display = 'none';

        const dataObject = {
            p: "fast-20",
            op: "transfer",
            tick: tokenName.trim(),
            amt: amount
        };
        const data = `data:,${JSON.stringify(dataObject)}`;
        wallet = window.solana;
        await wallet.connect();
        const fromWallet = wallet;
        const publicKey = new PublicKey(receiverAddress.toString());
        const transaction = await CreateTransaction(fromWallet, publicKey.toString(), data, connexion);

        const { signature } = await wallet.signAndSendTransaction(transaction);

        notyf.success('Your token transfer is underway. Please wait');
        notyf.open({
          type: 'info',
          message: "Closing this page may interrupt the transfer process"
        });

        const confirmedTransaction = await WaitForConfirmations(connexion, signature);

        const dataToSave = {
          from : senderAddress.toString(),
          to : receiverAddress.toString(),
          signature : signature
        }

        const response = await fetch('/memefi/transfer/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${process.env.JWT_TOKEN}`
          },
          body: JSON.stringify(dataToSave),
        });
        const _result = await response.json();

        transferAlert.removeAttribute('style');

        if (_result && _result.errorcode === 500) {
          transferErrorNotification.innerHTML = _result.data.join('');
          transferErrorNotification.style.display = 'block';
        }

        if (_result && _result.errorcode === 400 && _result.errortext) {
          notyf.error(_result.errortext);
          transferErrorNotification.innerHTML = _result.errortext;
          transferErrorNotification.style.display = 'block'
        }

        if (_result && _result.errorcode === 200 && _result.data) {
          transferErrorNotification.style.display = 'none';
          transferDivMsg.innerHTML = `<p>Token transfered with success. <a target="_blank" href="https://solscan.io/tx/${signature}">Your transaction hash</a> </p>`;
          transferAlert.classList.remove('d-none');
          updateTable();
        } 
        
        if (_result && _result.errorcode === 201 && _result.data) {
          transferErrorNotification.innerHTML = _result.data;
          transferErrorNotification.style.display = 'block';
          notyf.error(_result.data);
        }
      } 

    })



      let $table = $('#table');

      function formatTokenTotal(value, row, index) {
        return (row.price * row.balance).toLocaleString('en-US');
      }

      function airdropFormatter(value, row, index) {
          return [
              '<button type="button" class="btn btn-dark airdropToken btn-rounded" data-bs-toggle="modal" data-bs-target="#airdropMyToken" style="margin-right: 2%;">Airdrop</button>',
              '<button type="button" class="btn btn-warning burnToken btn-rounded" data-bs-toggle="modal" data-bs-target="#burnMyToken" style="margin-right: 2%;" >Burn</button>',
              '<button type="button" class="btn btn-light transferToken btn-rounded" data-bs-toggle="modal" data-bs-target="#transferMyToken">Transfer</button>',
          ].join('');
      }

      function formatEnglish(value, row, index) {
        return value ? value.toLocaleString('en-US') : 0;
      }

      function logoFormatter(value, row, index) {
        return ` <a href="/token?name=${row.name}"  target="_blank" rel="noopener noreferrer">
                              <img src=${value} alt="Logo" style="width: 50px; height: 50px;" class="logo" > 
                  </a> `;
      }

      window.operateEvents = {
          'click .transferToken': function (e, value, row, index) {

              const tokenName = document.getElementById("tokenNameId");
              tokenName.value = row.name;    
              
              const tokenNameIdBurn = document.getElementById("tokenNameIdBurn");
              tokenNameIdBurn.value = row.name;  

              const tokenNameIdAirdrop = document.getElementById("tokenNameIdAirdrop");
              tokenNameIdAirdrop.value = row.name;     
          },
          'click .airdropToken': function (e, value, row, index) {

              const tokenName = document.getElementById("tokenNameId");
              tokenName.value = row.name;     

              const tokenNameIdBurn = document.getElementById("tokenNameIdBurn");
              tokenNameIdBurn.value = row.name;  

              const tokenNameIdAirdrop = document.getElementById("tokenNameIdAirdrop");
              tokenNameIdAirdrop.value = row.name; 
          },
          'click .burnToken': function (e, value, row, index) {

              const tokenName = document.getElementById("tokenNameId");
              tokenName.value = row.name;   
              
              const tokenNameIdBurn = document.getElementById("tokenNameIdBurn");
              tokenNameIdBurn.value = row.name;  

              const tokenNameIdAirdrop = document.getElementById("tokenNameIdAirdrop");
              tokenNameIdAirdrop.value = row.name; 
          }
      }

      function initTable() {
        $table.bootstrapTable('destroy').bootstrapTable({
            height: 550,
            locale: 'en-US',
            columns: [
            {
                title: '',
                field: 'logo',
                align: 'center',
                valign: 'middle',
                sortable: false,
                formatter: logoFormatter
            },
            {
                title: 'Name',
                field: 'name',
                align: 'center',
                valign: 'middle',
                sortable: true
            },
            {
                title: 'Total',
                field: 'balance',
                align: 'center',  
                valign: 'middle',
                sortable: true,
                formatter: formatEnglish
            },
            {
                title: 'Price ($)',
                field: 'price',
                align: 'center',  
                valign: 'middle',
                sortable: true,
            },
            {
                title: 'Balance ($)',
                align: 'center',  
                valign: 'middle',
                sortable: true,
                formatter: formatTokenTotal
            },
            {
                
                align: 'center',
                valign: 'middle',
                sortable: false,
                events: window.operateEvents,
                formatter: airdropFormatter
            },
            ]
        });      
      }

      $(function () {
        initTable();
        $('#locale').change(initTable);
        updateTable();
      });

      async function updateTable() {
        if (window.solana && window.solana.isConnected) {
            wallet = window.solana;
            await wallet.connect();
            const publicKey = wallet.publicKey.toString()

            const table = $('#table');
            const newUrl = `/memefi/myasset?holderAddress=${encodeURIComponent(publicKey)}`;

            $.ajax({
                url: newUrl,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${process.env.JWT_TOKEN}`
                },
                success: function(response) {
                    const tableData = response.data;
                    table.bootstrapTable('load', tableData);
                }
            });

        } else {
          window.location.href = 'index.html';
        }
      }
  
  });
  
  
  
  