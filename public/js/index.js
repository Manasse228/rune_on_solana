

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

  const response = await fetch(`/memefi/token/statistic`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `${process.env.JWT_TOKEN}`
    }
  });
  const _result = await response.json();
  const result = _result.data;

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









  let $table = $('#table');
  
    function responseHandler(res) {
      $.each(res.rows, function (i, row) {
        row.state = $.inArray(row.id, selections) !== -1;
      });
      return res;
    }
  
    function operateFormatter(value, row, index) {
      return [
        '<button class="btn btn-primary mint btn-rounded" type="button">Mint</button>',
      ].join('');
    }

    function logoFormatter(value, row, index) {
      return ` <a href="/token?name=${row.name}"  target="_blank" rel="noopener noreferrer">
                              <img src=${value} alt="Logo" style="width: 50px; height: 50px;" class="logo" > 
                  </a> `;
    }

    function progressFormatter(value, row, index) {
      return `
        <div class="progress">
          <div class="progress-bar progress-bar-striped progress-bar-animated bg-danger" role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100" style="width: ${value}%"></div>
        </div>`;
    }

    function convertTimestamp(value, row, index) {
            if (value.toString().length === 10) {
              value *= 1000;
            }
            const date = new Date(value);
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const year = date.getFullYear();
            return `${month}/${day}/${year}`;
        }

    function formatEnglish(value, row, index) {
      return value ? value.toLocaleString('en-US') : 0;
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
            title: 'Per mint',
            field: 'lim',
            align: 'center',
            valign: 'middle',
            sortable: true,
            formatter: formatEnglish
          },
          {
            title: 'Holders',
            field: 'holders',
            align: 'center',
            valign: 'middle',
            sortable: true,
            formatter: formatEnglish
          },
          {
            title: 'Premine (%)',
            field: 'premine',
            align: 'center',
            valign: 'middle',
            sortable: true
          },
          {
            title: 'Deploy time',
            field: 'blockTime',
            align: 'center',
            valign: 'middle',
            sortable: true,
            formatter: convertTimestamp 
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
            title: 'Airdrop',
            field: 'operate',
            align: 'center',
            valign: 'middle',
            clickToSelect: false,
            events: window.operateEvents,
            formatter: operateFormatter
          }
        ]
      });

    }
  
    $(function () {
      initTable();
      $('#locale').change(initTable);
      updateTable();
    });

    async function updateTable() {
    const table = $('#table');
    const newUrl = `/memefi/mint/ongoing`;

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
  }

  
});

