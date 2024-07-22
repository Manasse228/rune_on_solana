 
  import {
    PublicKey
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
    const receiver = document.getElementById('receiver');

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
      receiver.value = wallet.publicKey.toString();
    } else {
      window.location.href = 'index.html';
    }
  
    const mintButton = document.getElementById('mint-token');
    const tradeButton = document.getElementById('trade-token'); 
    mintButton.addEventListener('click', async function(event) {

        const regex = /data:,\{"p":"fast-20","op":"mint","tick":"([^"]+)","amt":(\d+)\}/;
        const urlParams = new URLSearchParams(window.location.search);
        const tokenName = urlParams.get('name');

        const response = await fetch(`/memefi/mint/available?tokenName=${encodeURIComponent(tokenName)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${process.env.JWT_TOKEN}`
          }
        });
        const _result = await response.json();
        const result = _result.data;

        if ((_result && _result.errorcode === 400) || (_result && _result.errorcode === 201)) {
          if (_result.errorcode === 400) {
            notyf.error(_result.errortext);
          } 

          if (_result.errorcode === 201) {
            notyf.error(result);
          }
          
        } else {

          wallet = window.solana;
          await wallet.connect();
          const fromWallet = wallet;
          const publicKey = new PublicKey(wallet.publicKey.toString());

          const transaction = await CreateTransaction(fromWallet, publicKey.toString(), result, connexion);
          const { signature } = await wallet.signAndSendTransaction(transaction);

          notyf.success('Minting in progress');

          notyf.open({
            type: 'info',
            message: "Don't close this page"
          });

          const confirmedTransaction = await WaitForConfirmations(connexion, signature);
          
          const urlParams = new URLSearchParams(window.location.search);
          const tokenName = urlParams.get('name');

          const dataObject = {
            tick: tokenName,
            signature: signature,
            from: wallet.publicKey.toString()
          };

          const saveResponse = await fetch('/memefi/mint/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${process.env.JWT_TOKEN}`
            },
            body: JSON.stringify(dataObject),
          });
          const _saveResult = await saveResponse.json();
          const saveResult = _saveResult.data;

          if (_saveResult && _saveResult.errorcode === 400) {
            notyf.error(_saveResult.errortext);
          }

          if (_saveResult && _saveResult.errorcode === 201) {
            notyf.error('Minting failed. Try again!');
          } 

          if (saveResult <= 0) {
            notyf.success('Minting successful.');
            updateTable();
            init(tokenName);
          } 

        }
    })

    function getQueryParameter (param) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(param);
    }
    const tokenName = getQueryParameter('name');
  
    async function getTokenData(tokenName) {
      const response = await fetch(`/memefi/token/info?tokenName=${encodeURIComponent(tokenName)}`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `${process.env.JWT_TOKEN}`
                    }
            });
      const tokenData = await response.json();
      return tokenData;
    }
  
    function convertTimestamp(value) {
        if (value.toString().length === 10) {
          value *= 1000;
        }
        const date = new Date(value);
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      }
  
    function getMints(tokenData) {
      if (Number(tokenData.startBlock) >0) {
        if (!tokenData.mintOver) {
          return (Number(tokenData.remain) / Number(tokenData.lim)).toLocaleString('en-US');
        } else {
          return (Number(tokenData.max) / Number(tokenData.lim)).toLocaleString('en-US');
        }
      } else {
        const r = Number(tokenData.max) - Number(tokenData.remain);
        const p = (Number(tokenData.max) * Number(tokenData.premine)) / 100;
        const i = (r - p)/tokenData.lim;
        return i.toLocaleString('en-US');
      }
    }
  
    async function init(tokenName) {
      if (tokenName) {
  
        const _result = await getTokenData(tokenName);
        const tokenData = _result.data;

        if ((_result && _result.errorcode === 400) || (_result && _result.errorcode === 201)) {
          window.location.href = 'ongoingmint.html';
        } else {
          document.getElementById('tokenNameTitle').textContent = `${tokenData.name}`;
          document.getElementById('tokenDescription').textContent = `${tokenData.description}`;
          document.getElementById('amount').value = `${tokenData.lim}`;
  
          document.getElementById('twitterlink').href = tokenData.twitterlink;
          document.getElementById('logoid').src = tokenData.logo;
          document.getElementById('premineId').textContent = tokenData.premine+'%';
          document.getElementById('mintprogress').textContent = Number(tokenData.progress).toFixed(2) + ' %';
          
          document.getElementById('holderid').textContent = (tokenData.holders) ?  Number(tokenData.holders).toLocaleString('en-US') : 0;
  
          document.getElementById('mints').textContent = getMints(tokenData); 
          document.getElementById('burnAmount').textContent = tokenData.burnSupply;
          
          document.getElementById('totalTransfer').textContent = tokenData.transfercount;
          document.getElementById('maxsupplyid').textContent = (tokenData.max) ?  Number(tokenData.max).toLocaleString('en-US') : Number(tokenData.remain).toLocaleString('en-US');
          document.getElementById('circulatingsupply').textContent =  (Number(tokenData.startBlock) >0) ? ( (!tokenData.mintOver) ? Number(tokenData.remain).toLocaleString('en-US') : Number(tokenData.max).toLocaleString('en-US'))  : (Number(tokenData.max) - Number(tokenData.remain)).toLocaleString('en-US');
          document.getElementById('permint').textContent = (tokenData.lim) ?  Number(tokenData.lim).toLocaleString('en-US') : 0;
          document.getElementById('deploytime').textContent =  convertTimestamp(tokenData.blockTime);
          
          const progressBarDesign = document.getElementById('progressBarDesign');
          progressBarDesign.style = 'width:'+Number(tokenData.progress).toFixed(2) + '%';
          progressBarDesign.setAttribute('aria-valuenow', Number(tokenData.progress).toFixed(2));
  
          if (!tokenData.mintOver) {
              mintButton.style.display = 'block';
              tradeButton.style.display = 'none';
          } else {
              mintButton.style.display = 'none';
              tradeButton.style.display = 'block';
          }
  
          document.getElementById('blocknumber').innerHTML = `<a style="color: aquamarine;" href=https://solscan.io/tx/${tokenData.transactionHash} target="_blank">#${tokenData.blockNumber}</a>`;
  
          const fairId = document.getElementById('fairId');
          const fixId = document.getElementById('fixId');
  
          if(tokenData.startBlock >0) { // fair
            fairId.style.display = 'block';
            
            const startBlock = document.getElementById('startBlock');
            const endBlock = document.getElementById('endBlock');
            const currentBlock = document.getElementById('currentBlock');
  
            currentBlock.innerHTML = `<i class="fas fa-circle text-info"> </i> ${tokenData.currentBlock.toLocaleString('en-US')} Current Block`;
            startBlock.innerHTML = `<i class="fas fa-circle start-info"> </i> ${  tokenData.startBlock.toLocaleString('en-US')} Start Block`;
            endBlock.innerHTML = ` ${tokenData.endBlock.toLocaleString('en-US')} End Block <i class="fas fa-circle end-info"> </i>`;
  
          } else { // fix
            const fixprogress = document.getElementById('fixprogress');
            fixprogress.textContent = `${Number(tokenData.progress).toFixed(2)}% [${(tokenData.max - tokenData.remain).toLocaleString('en-US')}/${tokenData.max.toLocaleString('en-US')}]`;
            fixprogressBarDesign.style = 'width:'+Number(tokenData.progress).toFixed(2) + '%';
            fixprogressBarDesign.setAttribute('aria-valuenow', Number(tokenData.progress).toFixed(2));
            fixId.style.display = 'block';
          }
        }
      } else {
        window.location.href = 'ongoingmint.html';
      }
    }
  
    init(tokenName);

    let $table = $('#table');
    let selections = [];
  
    function getIdSelections() {
      return $.map($table.bootstrapTable('getSelections'), function (row) {
        return row.id;
      });
    }
  
    function amountFormat(value, row, index) {
      return Number(value).toLocaleString('en-US');
    }
  
    function progressFormatter(value, row, index) {
      return `
        <div class="progress">
          <div class="progress-bar " role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100" style="width: ${value}%"></div>
        </div>`;
    }
  
    window.operateEvents = {
        'click .mint': function (e, value, row, index) {
          window.open('/token?name=' + row.name, '_blank');
        }
    }
  
    function initTable() {
      $table.bootstrapTable('destroy').bootstrapTable({
        height: 550,
        locale: 'en-US',
        columns: [
  
          {
            title: 'Rank',
            field: 'Rank',
            align: 'center',
            valign: 'middle',
            sortable: true
          },
          {
            title: 'Address',
            field: 'Address',
            align: 'center',
            valign: 'middle',
            sortable: false
          },
          {
            title: 'Percentage',
            field: 'Percentage',
            align: 'center',
            valign: 'middle',
            sortable: false,
            formatter: progressFormatter
          },
          {
            title: 'Amount',
            field: 'Amount',
            align: 'center',
            valign: 'middle',
            sortable: true,
            formatter: amountFormat
          }
        ]
      });
  
      $table.on('check.bs.table uncheck.bs.table ' +
        'check-all.bs.table uncheck-all.bs.table',
        function () {
          selections = getIdSelections();
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
  
    function updateTable() {
        const table = $('#table');
        const newUrl = `/memefi/holders?tokenName=${encodeURIComponent(tokenName)}`;

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
            },
            error: function(error) {
                console.error('Error fetching data:', error);
            }
        });
    }
  
  
  });
  
  
  
  