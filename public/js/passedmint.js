

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
      '<button class="btn btn-success mint btn-rounded" type="button" style="margin-right: 8px;">View</button>',
      '<button class="btn btn-danger trade btn-rounded" type="button">Trade</button>',
    ].join('');
  }

  function logoFormatter(value, row, index) {
    return ` <a href="/token?name=${row.name}"  target="_blank" rel="noopener noreferrer">
                            <img src=${value} alt="Logo" style="width: 50px; height: 50px;" class="logo" > 
                </a> `;
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
          title: '',
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
    const newUrl = `/memefi/mint/passed`;

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
  
  
  
  