

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
  let selections = [];

  function getIdSelections() {
  return $.map($table.bootstrapTable('getSelections'), function (row) {
      return row.id;
  });
  }

  function responseHandler(res) {
    $.each(res.rows, function (i, row) {
        row.state = $.inArray(row.id, selections) !== -1;
    });
    return res;
  }

  function formatEnglish(value, row, index) {
    return value ? value.toLocaleString('en-US') : 0;
  } 

  function logoFormatter(value, row, index) {
    return ` <a href="/token?name=${row.tokenName}"  target="_blank" rel="noopener noreferrer">
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

      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
  }

  function hashLink(value, row, index) {
    return '<a href=https://solscan.io/tx/' + value + ' target="_blank">View</a>';
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
              field: 'tokenName',
              align: 'center',
              valign: 'middle',
              sortable: true
          },
          {
              title: 'From',
              field: 'from',
              align: 'center',
              valign: 'middle',
              sortable: true,
              formatter: formatEnglish
          },
          {
              title: 'To',
              field: 'to',
              align: 'center',
              valign: 'middle',
              sortable: true,
          },
          {
              title: 'Amount',
              field: 'tokenAmount',
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
              title: 'Type',
              field: 'type',
              align: 'center',
              valign: 'middle',
              sortable: true,
          },
          {
              title: 'Transaction',
              field: 'transactionHash',
              align: 'center',
              valign: 'middle',
              sortable: false,
              formatter: hashLink
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
        const newUrl = `/memefi/mytransfer?holderAddress=${encodeURIComponent(publicKey)}`;

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