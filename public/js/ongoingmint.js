

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











  let $table = $('#table');
 
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
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
          const day = String(date.getDate()).padStart(2, '0');
          const year = date.getFullYear();
          return `${month}/${day}/${year}`;
  }

  function formatEnglish(value, row, index) {
    return value ? value.toLocaleString('en-US') : 0;
  }

  function totalSupply(value, row, index) {
    return value ? value.toLocaleString('en-US') : "Fair Mint";
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
          formatter: totalSupply
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
          title: 'Date',
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

    $table.on('all.bs.table', function (e, name, args) {});

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
  
  
  
  