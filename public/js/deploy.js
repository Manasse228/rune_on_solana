import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

import {
  PublicKey,
} from '@solana/web3.js';

import { Buffer } from 'buffer';
window.Buffer = window.Buffer || Buffer;

import { disconnectButton, balanceSpan, publicKeySpan, walletInfo } from './library/barMenu';

import { Notification } from './library/Notyf';
const notyf = Notification();

import { CreateTransaction, getConnection, SimulateTransaction, WaitForConfirmations, checkNetwork } from './library/Transaction';
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



  const formFields = document.getElementById('form-fields');
  const mintTypeRadios = document.querySelectorAll('input[name="mintType"]');

  const createFormField = (type) => {
    if (type === 'fixCap') {
      return `

        <div class="form-group">
          <label for="fix_tokenName" class="required">Token Name 
          <span data-toggle="tooltip" class="info-bubble" title="Nom du token">&#9432;</span>
          </label>
          <input type="text" class="form-control" id="fix_tokenName" placeholder="runesol" required value="">
          <div class="error-message" id="fix_nameError">Token Name is required.</div>
        </div>
        <div class="form-group">
          <label for="fix_tokenDescription" class="required">Project Description
          <span data-toggle="tooltip" class="info-bubble" title="Drop the project description">&#9432;</span>
          </label>
          <textarea class="form-control" id="fix_tokenDescription" rows="3" required placeholder="Your project description ..........."></textarea>
          <div class="error-message" id="fix_tokenDescriptionError">Your project description is required.</div>
        </div>
        <div class="form-group">
          <label for="fix_twitter">Twitter link
          <span data-toggle="tooltip" class="info-bubble" title="Provide the project's twitter account link">&#9432;</span>
          </label>
          <input type="url" class="form-control" id="fix_twitter" required placeholder="https://x.com/b_fast_official">
        </div>
        <div class="form-group">
          <label for="fix_image" class="required">Image URL
          <span data-toggle="tooltip" class="info-bubble" title="Provide project logo file"></span>
          </label>
          <input type="url" class="form-control" id="fix_image" required value="">
          <div class="error-message" id="fix_imageError">A logo online link is required.</div>
          <img id="imagePreview" src="" alt="">
        </div>

        <hr class="custom-hr">

        <div class="form-group"> 
          <label for="fix_totalSupply" class="required">Total Supply
          <span data-toggle="tooltip" class="info-bubble" title="The amount of tokens that are circulating in the market and are in public hands.">&#9432;</span>
          </label>
          <input type="number" class="form-control" id="fix_totalSupply" placeholder="21,000,000" required value="">
          <div class="error-message" id="fix_totalSupplyError">Total Supply is required.</div>
        </div>
        <div class="form-group">
          <label for="fix_mint" class="required">Mint 
          <span data-toggle="tooltip" class="info-bubble" title="Tokens received per mint">&#9432;</span>
          </label>
          <input type="number" class="form-control" id="fix_mint" placeholder="1,000" required value="">
          <div class="error-message" id="fix_mintError">Mint amount is required.</div>
        </div>
        <div class="form-group">
          <label for="fix_premine" class="required">Premine (%)
          <span data-toggle="tooltip" class="info-bubble" title="Dev token allocation in percentage. Max 5%">&#9432;</span>
          </label>
          <input type="number" class="form-control" id="fix_premine" min="0" max="5" placeholder="0" required value=0>
          <div class="error-message" id="fix_premineError">Premine is required.</div>
        </div>
      `;
    } else if (type === 'fairMint') {
      return `
        
        <div class="form-group">
          <label for="fair_tokenName" class="required">Token Name 
          <span data-toggle="tooltip" class="info-bubble" title="Nom du token.">&#9432;</span>
          </label>
          <input type="text" class="form-control" placeholder="runesol" id="fair_tokenName" required>
          <div class="error-message" id="fair_tokenNameError">Token Name is required.</div>
        </div>
        <div class="form-group" >
          <label for="fair_tokenDescription" class="required">Project Description
          <span data-toggle="tooltip" class="info-bubble" title="Drop the project description">&#9432;</span>
          </label>
          <textarea class="form-control" id="fair_tokenDescription" rows="3" required placeholder="Your project description ..........."></textarea>
          <div class="error-message" id="fair_tokenDescriptionError">Your project description is required.</div>
        </div>
        <div class="form-group">
          <label for="fair_twitter">Twitter link
          <span data-toggle="tooltip" class="info-bubble" title="Provide the project's twitter account link">&#9432;</span>
          </label>
          <input type="url" class="form-control" id="fair_twitter" required placeholder="https://x.com/b_fast_official">
        </div>
        <div class="form-group">
          <label for="fair_image" class="required">Image URL</label>
          <input type="url" class="form-control" id="fair_image" required>
          <div class="error-message" id="fair_imageError">A logo online link is required.</div>
          <img id="imagePreview" src="" alt="">
        </div>

        <hr class="custom-hr">

        <div class="form-group">
          <label for="fair_blockStart" class="required">Block Start
          <span data-toggle="tooltip" class="info-bubble" title="Set the Block Number where mint will Begin">&#9432;</span>
          </label>
          <input type="number" class="form-control" id="fair_blockStart" required placeholder="100000">
          <div class="error-message" id="fair_blockStartError">Bloc Start is required.</div>
        </div>
        <div class="form-group">
          <label for="fair_blockEnd" class="required">Block End
          <span data-toggle="tooltip" class="info-bubble" title="Set the Block Number where mint will End">&#9432;</span>
          </label>
          <input type="number" class="form-control" id="fair_blockEnd" required placeholder="129000">
          <div class="error-message" id="fair_blockEndError">Block End is required.</div>
        </div>
        <div class="form-group">
          <label for="fair_mint" class="required">Mint
          <span data-toggle="tooltip" class="info-bubble" title="Tokens received per mint">&#9432;</span>
          </label>
          <input type="number" class="form-control" id="fair_mint" required placeholder="1000" >
          <div class="error-message" id="fair_mintError">Mint amount is required.</div>
        </div>
        <div class="form-group">
          <label for="fair_premine" class="required">Premine (%)
          <span data-toggle="tooltip" class="info-bubble" title="Dev token allocation in percentage. Max 5%">&#9432;</span>
          </label>
          <input type="number" class="form-control" id="fair_premine" min="0" max="5" required value=0>
          <div class="error-message" id="fair_premineError">Premine is required.</div>
        </div>
      `;
    }
  };


  const updateFormFields = () => {
    const selectedType = document.querySelector('input[name="mintType"]:checked').value;
    formFields.innerHTML = createFormField(selectedType);
    const fair_imageInput = document.getElementById('fair_image'); 
    const fix_imageInput = document.getElementById('fix_image');
    if (fair_imageInput) {
        fair_imageInput.addEventListener('input', () => {
        document.getElementById('imagePreview').src = fair_imageInput.value;
      });
    }

    if (fix_imageInput) {
        fix_imageInput.addEventListener('input', () => {
          document.getElementById('imagePreview').src = fix_imageInput.value;
        });
      }
    
    
  };

  mintTypeRadios.forEach(radio => {
    radio.addEventListener('change', updateFormFields);
  });

  updateFormFields(); // Initialize the form with the default selected radio button

  const handleDeployClick = async (data, dataToSave) => {    
    wallet = window.solana;
    await wallet.connect();
    const fromWallet = wallet;
    const publicKey = new PublicKey(wallet.publicKey.toString());
    const deployDivMsg = document.getElementById('deploySuccessNotification_message');
    const deployAlert = document.getElementById('deploySuccessNotification');

    deployButton.disabled = true;

    try {
      const transaction = await CreateTransaction(fromWallet, publicKey.toString(), data, connexion);

       // Simulate the transaction
       //const isSimulationSuccessful = await SimulateTransaction(transaction, connection);

      const { signature } = await wallet.signAndSendTransaction(transaction);

      notyf.success('Deployment is underway. Please wait');
      notyf.open({
        type: 'info',
        message: "Closing this page may interrupt the deployment process"
      });

      const confirmedTransaction = await WaitForConfirmations(connexion, signature);

        // from, to, transactionHash, blockNumber, blockTime, description, twitterlink, logo
        dataToSave.from = publicKey.toString();
        dataToSave.to = publicKey.toString();
        dataToSave.transactionHash = signature;
        dataToSave.blockNumber = confirmedTransaction.slot;
        dataToSave.blockTime = confirmedTransaction.blockTime;

        const selectedType = document.querySelector('input[name="mintType"]:checked').value;
        const response = await fetch(selectedType === 'fixCap' ? '/api/fix/saveToken' : '/api/fair/saveToken', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSave),
        });
        const result = await response.json();

        if (!result) {
          notyf.success('Yur deploy is not valid by the system, please contact admin');
        } else {
          notyf.success('You can now proceed with the next steps. Deployment is complete.');

          deployDivMsg.innerHTML = `<p>Token deploy with success. <a target="_blank" href="https://solscan.io/tx/${signature}">Your transaction hash</a> <br /> You will be redirected in 15 seconds.</p>`;
          deployAlert.classList.remove('d-none');
          deployAlert.removeAttribute('style');

          setTimeout(function() {
            window.location.href = `/token?name=${dataToSave.tick}`;
          }, 15000); // 15000 millisecondes = 15 secondes
        }



    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };


  const deployButton = document.getElementById('deploy-token');
  deployButton.addEventListener('click', async function(event) {

      event.preventDefault();
      let isValid = true;
      const errorNotification = document.getElementById('errorNotification');
      errorNotification.style.display = 'none';
      errorNotification.innerHTML = '';

      const selectedType = document.querySelector('input[name="mintType"]:checked').value;

      if (selectedType === 'fixCap') {
        const fields = [
            { id: 'fix_tokenName', errorId: 'fix_nameError', message: 'Token Name is required.' },
            { id: 'fix_tokenDescription', errorId: 'fix_tokenDescriptionError', message: 'Your project description is required.' },
            { id: 'fix_image', errorId: 'fix_imageError', message: 'A logo please' },
            { id: 'fix_totalSupply', errorId: 'fix_totalSupplyError', message: 'Total Supply is required.' },
            { id: 'fix_mint', errorId: 'fix_mintError', message: 'Mint amount is required.' },
            { id: 'fix_premine', errorId: 'fix_premineError', message: 'Premine is required' }
          ]

          fields.forEach(field => {
            const input = document.getElementById(field.id);
            const errorMessage = document.getElementById(field.errorId);
            if (input.value.trim() === '') {
              input.classList.add('is-invalid');
              errorMessage.style.display = 'block';
              //errorNotification.innerHTML += `<p>${field.message}</p>`;
              isValid = false;
            } else {
                if (input.id === "fix_tokenName" && !(/^[a-zA-Z0-9]+$/.test(input.value.trim()))) {
                    input.classList.add('is-invalid');
                    errorMessage.style.display = 'block';
                    errorMessage.innerHTML = "Token name must be a single word without spaces and special character";
                } else if (input.id === "fix_image" && !(/\.(jpeg|jpg|gif|png|bmp|webp|svg)$/i.test(input.value.trim()))) {
                    input.classList.add('is-invalid');
                    errorMessage.style.display = 'block';
                    errorMessage.innerHTML = "Please enter a valid URL that points to an online image (e.g., .jpeg, .jpg, .gif, .png, .bmp, .webp, .svg)";
                } else if (input.id === "fix_totalSupply" &&  !(Number(input.value.trim()) >0) ) {
                    input.classList.add('is-invalid');
                    errorMessage.style.display = 'block';
                    errorMessage.innerHTML = "Total Supply must be greater than Zero (0)";
                } else if (input.id === "fix_mint" &&  !(Number(input.value.trim()) >0) ) {
                    input.classList.add('is-invalid');
                    errorMessage.style.display = 'block';
                    errorMessage.innerHTML = "The mint amount must be greater than Zero (0)";
                } else if (input.id === "fix_premine" &&  !(Number(input.value.trim()) >=0 && Number(input.value.trim()) <=5)) {
                    input.classList.add('is-invalid');
                    errorMessage.style.display = 'block';
                    errorMessage.innerHTML = "Premine must be between 0 and 5 inclusive";
                } else {
                    input.classList.remove('is-invalid');
                    errorMessage.style.display = 'none';  
                }
            }
          })

      } else {
        const fields = [
            { id: 'fair_tokenName', errorId: 'fair_tokenNameError', message: 'Token Name is required.' },
            { id: 'fair_tokenDescription', errorId: 'fair_tokenDescriptionError', message: 'Your project description is required.' },
            { id: 'fair_image', errorId: 'fair_imageError', message: 'A logo please' },
            { id: 'fair_blockStart', errorId: 'fair_blockStartError', message: '' },
            { id: 'fair_blockEnd', errorId: 'fair_blockEndError', message: '' },
            { id: 'fair_mint', errorId: 'fair_mintError', message: '' },
            { id: 'fair_premine', errorId: 'fair_premineError', message: '' }
          ]

          fields.forEach(field => {
            const input = document.getElementById(field.id);
            const errorMessage = document.getElementById(field.errorId);
            if (input.value.trim() === '') {
              input.classList.add('is-invalid');
              errorMessage.style.display = 'block';
              isValid = false;
            } else {
                if (input.id === "fair_tokenName" && !(/^[a-zA-Z0-9]+$/.test(input.value.trim()))) {
                    input.classList.add('is-invalid');
                    errorMessage.style.display = 'block';
                    errorMessage.innerHTML = "Token name must be a single word without spaces and special character";
                } else if (input.id === "fair_image" && !(/\.(jpeg|jpg|gif|png|bmp|webp|svg)$/i.test(input.value.trim()))) {
                    input.classList.add('is-invalid');
                    errorMessage.style.display = 'block';
                    errorMessage.innerHTML = "Please enter a valid URL that points to an online image (e.g., .jpeg, .jpg, .gif, .png, .bmp, .webp, .svg)";
                } else if (input.id === "fair_blockStart" &&  !(Number(input.value.trim()) >0) ) {
                    input.classList.add('is-invalid');
                    errorMessage.style.display = 'block';
                    errorMessage.innerHTML = "Block Start must be greater than Zero (0)";
                } else if (input.id === "fair_blockEnd" &&  !(Number(input.value.trim()) >0) ) {
                    input.classList.add('is-invalid');
                    errorMessage.style.display = 'block';
                    errorMessage.innerHTML = "Block End must be greater than Zero (0)";
                }  else if (input.id === "fair_mint" &&  !(Number(input.value.trim()) >0) ) {
                    input.classList.add('is-invalid');
                    errorMessage.style.display = 'block';
                    errorMessage.innerHTML = "The mint amount must be greater than Zero (0)";
                } else if (input.id === "fair_premine" &&  !(Number(input.value.trim()) >=0 && Number(input.value.trim()) <=5)) {
                    input.classList.add('is-invalid');
                    errorMessage.style.display = 'block';
                    errorMessage.innerHTML = "Premine must be between 0 and 5 inclusive";
                } else {
                    input.classList.remove('is-invalid');
                    errorMessage.style.display = 'none';  
                }
            }
          })
      }  

      if (!isValid) {
        //errorNotification.style.display = 'block';
      } else {

        if (selectedType === 'fixCap') {
            const fix_totalSupply = Number(document.getElementById("fix_totalSupply").value);
            const fix_mint = Number(document.getElementById("fix_mint").value);
            const fix_premine = Number(document.getElementById("fix_premine").value);

            const I = fix_totalSupply - (fix_totalSupply * (fix_premine / 100));
            if ( !(I % fix_mint === 0)) {
                errorNotification.innerHTML = `<p>Token creation failed: The total supply for investors must be a multiple of the mint limit. Please adjust the total supply or the mint limit.</p>`;
                errorNotification.style.display = 'block';
            } else {
                errorNotification.style.display = 'none';

                const dataObject = {
                    p: "fast-20",
                    op: "deploy",
                    tick: document.getElementById("fix_tokenName").value.trim(),
                    max: fix_totalSupply,
                    lim: fix_mint,
                    premine: fix_premine
                };
                const data = `data:,${JSON.stringify(dataObject)}`;

                const checkData = dataObject;
                checkData.logo = document.getElementById("fix_image").value;
                const response = await fetch('/api/fix/checkdeployToken', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(checkData),
                });
                const result = await response.json();

                const dataToSave = dataObject;
                dataToSave.description = document.getElementById("fix_tokenDescription").value;
                dataToSave.twitterlink = document.getElementById("fix_twitter").value;

                if (result.length === 0) {
                  handleDeployClick(data, dataToSave);
                } else {
                  errorNotification.innerHTML = result.join('');
                  errorNotification.style.display = 'block'
                }
                
            }
        } else {

            const fair_blockStart = Number(document.getElementById("fair_blockStart").value);
            const fair_blockEnd = Number(document.getElementById("fair_blockEnd").value);
            const fair_mint = Number(document.getElementById("fair_mint").value);
            const fair_premine = Number(document.getElementById("fair_premine").value);

            if ( fair_blockStart >= fair_blockEnd) {
                errorNotification.innerHTML = `<p>Token creation failed: The Block End must be greater than Block Start</p>`;
                errorNotification.style.display = 'block';
            } else {
                errorNotification.style.display = 'none';

                const dataObject = {
                    p: "fast-20",
                    op: "deploy",
                    tick: document.getElementById("fair_tokenName").value.trim(),
                    sb: fair_blockStart,
                    eb: fair_blockEnd,
                    lim: fair_mint,
                    premine: fair_premine
                };
                const data = `data:,${JSON.stringify(dataObject)}`;

                const checkData = dataObject;
                checkData.logo = document.getElementById("fair_image").value;
                const response = await fetch('/api/fair/checkdeployToken', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(checkData),
                });
                const result = await response.json();
                console.log('oups ', result)

                const dataToSave = dataObject;
                dataToSave.description = document.getElementById("fair_tokenDescription").value;
                dataToSave.twitterlink = document.getElementById("fair_twitter").value;

                if (result.length === 0) {
                  handleDeployClick(data, dataToSave);
                } else {
                  errorNotification.innerHTML = result.join('');;
                  errorNotification.style.display = 'block'
                }
            }
        }
      }


      // https://assets.pancakeswap.finance/web/phishing-warning/phishing-warning-bunny-1.png
  });

  

});
