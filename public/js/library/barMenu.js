

import '../../style/rune.css';


export const disconnectButton = document.getElementById('disconnect');
export const walletInfo = document.getElementById('wallet-info');
export const publicKeySpan = document.getElementById('public-key');
export const balanceSpan = document.getElementById('balance');


document.addEventListener('DOMContentLoaded', async () => {
    const mobileScreen = window.matchMedia("(max-width: 990px )");   

    document.querySelectorAll('.dashboard-nav-dropdown-toggle').forEach(item => {
        item.addEventListener('click', function() {
            const parentDropdown = this.closest('.dashboard-nav-dropdown');
            if (parentDropdown) {
                parentDropdown.classList.toggle('show');
                parentDropdown.querySelectorAll('.dashboard-nav-dropdown').forEach(child => {
                    child.classList.remove('show');
                });
            }
            const siblings = Array.from(this.parentNode.parentNode.children).filter(child => child !== this.parentNode);
            siblings.forEach(sibling => {
                sibling.classList.remove('show');
            });
        });
    });

    // Add a click event listener to the elements with the class 'menu-toggle'
    document.querySelectorAll('.menu-toggle').forEach(item => {
        item.addEventListener('click', function() {
            if (mobileScreen.matches) {
                document.querySelector('.dashboard-nav').classList.toggle('mobile-show');
            } else {
                document.querySelector('.dashboard').classList.toggle('dashboard-compact');
            }
        });
    });





});
