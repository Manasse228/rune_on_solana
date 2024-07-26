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

  
  if (window.solana && !window.solana.isConnected) {
    wallet = window.solana;
    await wallet.connect();
    checkNetwork(wallet, connexion, publicKeySpan, balanceSpan, walletInfo);
  } else {
    window.location.href = 'index.html';
  }


  const sol_address_input = document.getElementById('sol_address');
  sol_address_input.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
          event.preventDefault(); // Prevent the default action, if any
          
          loadPage(currentPage);
      }
  });


let currentPage = 1;
let totalPages = 1;
const nodatadiv = document.getElementById('no-data');

async function fetchData(page = 1) {

    const holderAddress = sol_address_input.value;
    const response = await fetch(`/memefi/assets?page=${encodeURIComponent(page)}&holderAddress=${encodeURIComponent(holderAddress)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
    return data.data;
}

function renderCards(data) {
    const container = document.getElementById('card-container');
    container.innerHTML = '';

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'col-md-4';

        card.innerHTML = `
            <div class="card card-custom">
                <div class="card-body">

                    <div class="container ">
                        <div class="row">
                            <div class="col-12">
                                <div class="text-image-inline">
                                    <h5 class="card-title">${item.name}</h5>
                                    <img src="${item.logo}" alt="Sample Image" class="inline-image rounded-image" style="margin-left: 15px;">
                                </div>
                            </div>
                        </div>
                    </div>

                    <p class="card-text" style="margin-bottom: -2px;">${ item.balance ? item.balance.toLocaleString('en-US') : 0}</p>
                    <small class="text-muted">${item.mintCount} mints</small>
                </div>
                <div class="card-footer">
                  
                    <a href="${item.mintStatus ? '/token?name='+item.name : '/token?name='+item.name }"         target="_blank" class="btn ${item.mintStatus ? 'btn-primary' : 'btn-danger'} btn-block btn-rounded">${item.mintStatus ? 'Mint' : 'Trade'}</a>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

function renderPagination() {
    const paginationContainer = document.querySelector('.pagination');
    paginationContainer.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = 'page-item ' + (i === currentPage ? 'active' : '');
        pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;

        pageItem.addEventListener('click', () => {
            currentPage = i;
            loadPage(i);
        });

        paginationContainer.appendChild(pageItem);
    }
}

async function loadPage(page) {
    const data = await fetchData(page);
    totalPages = Number(data.totalPages);
    if (totalPages >0) {
        nodatadiv.style.display = 'none'
        renderCards(data.result);
        renderPagination();
    } else {
        const container = document.getElementById('card-container');
        container.innerHTML = '';
        const paginationContainer = document.querySelector('.pagination');
        paginationContainer.innerHTML = '';

        nodatadiv.style.display = 'block'
    }

}






});