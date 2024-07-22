
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  sendAndConfirmTransaction
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

  const editDeployErrorNotification = document.getElementById('editDeployErrorNotification');
  editDeployErrorNotification.innerHTML = '';
  const editDeployDivMsg = document.getElementById('editDeploySuccessNotification_message');
  const editDeployAlert = document.getElementById('editDeploySuccessNotification');
  const updateButton = document.getElementById('updateButton');

  updateButton.addEventListener('click', async () => {

    const tokenDescription = document.getElementById("tokenDescription").value;
    const senderAddress = wallet.publicKey.toString();
    const twitterLink = document.getElementById("twitterLink").value;
    const tokenName = document.getElementById("tokenNameId").value;
    
    const dataToSave = {
      owner : senderAddress,
      tokenName : tokenName,
      twitterlink : twitterLink,
      description : tokenDescription
    }

    const message = Buffer.from(JSON.stringify(dataToSave));
    const signedMessage = await wallet.signMessage(message);
    const signedMessageHex = Buffer.from(signedMessage.signature).toString('hex');
    dataToSave.signedMessage = signedMessageHex;

    const response = await fetch(`/memefi/deploy/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${process.env.JWT_TOKEN}`
      },
      body: JSON.stringify(dataToSave),
    });

    const _saveResult = await response.json();
    const saveResult = _saveResult.data;

    if (_saveResult && _saveResult.errorcode === 400) {
      editDeployErrorNotification.innerHTML = _saveResult.errortext;
      editDeployErrorNotification.style.display = 'block';
    }

    if (saveResult && saveResult.length > 0) {
      editDeployErrorNotification.innerHTML = saveResult.join('');
      editDeployErrorNotification.style.display = 'block';
    } 

    if (saveResult && saveResult.length === 0) {
      notyf.success('<p>Token update with success</p>');
      editDeployErrorNotification.style.display = 'none';
      editDeployAlert.removeAttribute('style');
      editDeployDivMsg.innerHTML = `<p>Token update with success</p>`;
      editDeployAlert.classList.remove('d-none');
    } 

  })

  const claimPremineErrorNotification = document.getElementById('claimPremineErrorNotification');
  claimPremineErrorNotification.innerHTML = '';
  const claimDeployDivMsg = document.getElementById('claimPremineSuccessNotification_message');
  const claimDeployAlert = document.getElementById('claimPremineSuccessNotification');
  const claimButton = document.getElementById('claimPremineButton');
  claimButton.addEventListener('click', async () => {

    const tokenName = document.getElementById("tokenClaimNameId").value;
    const amount = document.getElementById("premineAmount").value;
    const senderAddress = wallet.publicKey.toString();

    await wallet.connect();
    const fromWallet = wallet;
    const publicKey = new PublicKey(wallet.publicKey.toString());
    const dataObject = {
      p: "fast-20",
      op: "premine",
      tick: tokenName,
      amount: amount
    };
    const data = `data:,${JSON.stringify(dataObject)}`;
    const transaction = await CreateTransaction(fromWallet, publicKey.toString(), data, connexion);
    const { signature } = await wallet.signAndSendTransaction(transaction);

    notyf.success('Claim in progress');
    notyf.open({
      type: 'info',
      message: "Don't close this page"
    });

    const confirmedTransaction = await WaitForConfirmations(connexion, signature);
    const dataToSave = {
      owner : senderAddress,
      tokenName : tokenName,
      transaction: signature
    }

  const response = await fetch(`/memefi/deploy/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `${process.env.JWT_TOKEN}`
    },
    body: JSON.stringify(dataToSave),
  });

  const _saveResult = await response.json();
  const saveResult = _saveResult.data;

  if (_saveResult && _saveResult.errorcode === 400) {
    claimPremineErrorNotification.innerHTML = _saveResult.errortext;
    claimPremineErrorNotification.style.display = 'block';
  }

  if (saveResult && saveResult.length > 0) {
    claimPremineErrorNotification.innerHTML = saveResult.join('');
    claimPremineErrorNotification.style.display = 'block';
  } 

  if (saveResult && saveResult.length === 0) {
    notyf.success('<p>Premine claim with success</p>');
    claimPremineErrorNotification.style.display = 'none';
    claimDeployAlert.removeAttribute('style');
    claimDeployDivMsg.innerHTML = `<p>Premine claim with success</p>`;
    claimDeployAlert.classList.remove('d-none');
    updateTable();
  } 


  })









  let $table = $('#table');
  let selections = [];

  function responseHandler(res) {
    $.each(res.rows, function (i, row) {
        row.state = $.inArray(row.id, selections) !== -1;
    });
    return res;
  }

  function operateFormatter(value, row, index) {
    return [
        '<button type="button" class="btn btn-warning updateToken btn-rounded" data-bs-toggle="modal" data-bs-target="#editMyDeploy">Edit</button>',
    ].join('');
  }

  function premineFormatter(value, row, index) {
    if (Number(row.premine >0) && row.mintOver && !row.alreadyPremine) {
      return [
          '<button type="button" class="btn btn-warning claimPremine btn-rounded" data-bs-toggle="modal" data-bs-target="#claimMyToken">Claim</button>',
      ].join('');
    } else if (Number(row.premine >0) && row.mintOver && row.alreadyPremine) {
      return [
          `<a href="https://solscan.io/tx/${row.premineHash}" target="_blank" rel="noopener noreferrer">Claim link</a>`,
      ].join('');
    } else {
      return [
          '<p>No claim</p>',
      ].join('');
    }
  }

  function formatEnglish(value, row, index) {
    return value ? value.toLocaleString('en-US') : 0;
  } 

  function logoFormatter(value, row, index) {
    return ` <a href="/token?name=${row.name}"  target="_blank" rel="noopener noreferrer">
                        <img src=${value} alt="Logo" style="width: 50px; height: 50px;" class="logo" > 
            </a> `;
  }

  function convertTimestamp(value, row, index) {
      if (value.toString().length === 10) {
        value *= 1000;
      }
      const date = new Date(value);
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
  }

  function hashLink(value, row, index) {
    return '<a href=https://solscan.io/tx/' + value + ' target="_blank">View</a>';
  }

  function progressFormatter(value, row, index) {
    return `
      <div class="progress">
      <div class="progress-bar progress-bar-striped progress-bar-animated bg-danger" role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100" style="width: ${value}%"></div>
      </div>`;
  }

  window.operateEvents = {
      'click .updateToken': function (e, value, row, index) {
          const description = document.getElementById('tokenDescription');
          const twitterLink = document.getElementById('twitterLink');
          const tokeName = document.getElementById('tokenNameId');

          twitterLink.value  = row.twitterlink;
          description.value  = row.description;
          tokeName.value  = row.name;
      },
      'click .claimPremine': function (e, value, row, index) {
          const tokenClaimNameId = document.getElementById('tokenClaimNameId');
          const premineAmount = document.getElementById('premineAmount');

          tokenClaimNameId.value  = row.name;
          premineAmount.value  = Number((row.max * row.premine)/100);
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
            title: 'Total Supply',
            field: 'max',
            align: 'center',
            valign: 'middle',
            sortable: true,
            formatter: formatEnglish
        },
        {
            title: 'Limit',
            field: 'lim',
            align: 'center',
            valign: 'middle',
            sortable: true,
            formatter: formatEnglish
        },
        {
            title: 'BlockNumber',
            field: 'blockNumber',
            align: 'center',
            valign: 'middle',
            sortable: true,
            formatter: formatEnglish
        },
        {
            title: 'Date',
            field: 'blockTime',
            align: 'center',
            valign: 'middle',
            sortable: true,
            formatter: convertTimestamp
        },
        {
            title: 'Transaction',
            field: 'transactionHash',
            align: 'center',
            valign: 'middle',
            sortable: true,
            formatter: hashLink
        },
        {
            title: 'Progress',
            field: 'progress',
            align: 'center',
            valign: 'middle',
            sortable: true,
            formatter: progressFormatter
        },
        {
            title: 'Update',
            field: 'operate',
            align: 'center',
            valign: 'middle',
            clickToSelect: false,
            events: window.operateEvents,
            formatter: operateFormatter
        },
        {
            title: 'Premine',
            align: 'center',
            valign: 'middle',
            clickToSelect: false,
            events: window.operateEvents,
            formatter: premineFormatter
        }
        ]
    });

    $table.on('all.bs.table', function (e, name, args) {
        //console.log(name, args);
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
          const newUrl = `/memefi/myDeploy?from=${encodeURIComponent(publicKey)}`;

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



