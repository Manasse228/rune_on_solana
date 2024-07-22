const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoConf = require('./config/mongoDB');
const DeployCtrl = require('./router/DeployCtrl');
const TokenCtrl = require('./router/TokenCtrl');
const MintCtrl = require('./router/MintCtrl');
const userCtrl = require('./router/UserCtrl');
const UserBalanceCtrl = require('./router/UserBalanceCtrl');
const TransferCtrl = require('./router/TransferCtrl');
const BurnCtrl = require('./router/BurnCtrl');

const apiRouter = require('./apiRouter').router;
const cors = require('cors');//evite les erreurs Cross-Allow-Origin
const passport = require('passport');
const Passport = require('./config/passportJWT');
const Utils = require("./config/Utils");

const app = express();
const port = 3000;




userCtrl.initAdminCreation();


// Configuration des middlewares
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static(path.join(__dirname, 'dist')));

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/deploy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'deploy.html'));
});

app.get('/ongoingmint', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ongoingmint.html'));
});

app.get('/mymints', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mymints.html'));
});

app.get('/upcomingmint', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upcomingmint.html'));
});

app.get('/passedmint', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'passedmint.html'));
});

app.get('/mytransfer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mytransfer.html'));
});

app.get('/myburn', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'myburn.html'));
});

app.get('/rune', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'rune.html'));
});


app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/mydeploy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mydeploy.html'));
});

app.get('/mybalance', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mybalance.html'));
});

app.get('/token', (req, res) => {
  const tokenName = req.query.name;
  if (tokenName) {
    res.sendFile(path.join(__dirname, 'public', 'token.html'));
  } else {
    res.redirect('/mint');
  }
});



/************************** Token Info **************************/

app.get('/api/tokens/info', async (req, res) => { ///////////////////////////////
  const { name } = req.query;
  if (name) {
    try {
      TokenCtrl.getTokenInfo(name)
      .then( _ => {
        res.json(_);
      }).catch( _ => {
        res.json(_);
      })
    } catch (error) {
      console.log('error ', error)
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.json({});
  }
});

app.get('/api/statistic', async (req, res) => {
  try {
    MintCtrl.getStatistique()
    .then( _ => {
      res.json(_);
    }).catch( _ => {
      res.json(_);
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});




/************************** Deploy **************************/

app.post('/api/fair/checkdeployToken', async (req, res) => {
  const { tick, sb, eb, lim, premine, logo } = req.body;
  try {
    const result = await DeployCtrl.pre_fair_check_addToken(tick, sb, eb, lim, premine, logo)
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/fix/saveToken', async (req, res) => {
  const { tick, max, lim, premine, from, to, transactionHash, blockNumber, blockTime, description, twitterlink, logo } = req.body;
  try {
    DeployCtrl.fix_save_addToken(tick, max, lim, premine, from, to, transactionHash, blockNumber, blockTime, description, twitterlink, logo)
    .then( _ => {
      res.json(_);
    }).catch( _ => {
      res.json(_);
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/fair/saveToken', async (req, res) => {
  const { tick, sb, eb, lim, premine, from, to, transactionHash, blockNumber, blockTime, description, twitterlink, logo } = req.body;
  try {
    DeployCtrl.fair_save_addToken(tick, sb, eb, lim, premine, from, to, transactionHash, blockNumber, blockTime, description, twitterlink, logo )
    .then( _ => {
      res.json(_);
    }).catch( _ => {
      res.json(_);
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/fix/checkdeployToken', async (req, res) => {
  const { tick, max, lim, premine, logo } = req.body;
  try {
    const result = await DeployCtrl.pre_fix_check_addToken(tick, max, lim, premine, logo);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


/************************** Mint **************************/


app.get('/api/mint/upcoming', async (req, res) => {
  try {
    TokenCtrl.getUpComingMint()
    .then( _ => {
      res.json(_);
    }).catch( _ => {
      res.json(_);
    })
  } catch (error) {
    console.log('error ', error)
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/mint/ongoing', async (req, res) => {
  try {
    TokenCtrl.getOnGoingMint()
    .then( _ => {
      res.json(_);
    }).catch( _ => {
      res.json(_);
    })
  } catch (error) {
    console.log('error ', error)
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/mint/passed', async (req, res) => {
  try {
    TokenCtrl.getPassedMint()
    .then( _ => {
      res.json(_);
    }).catch( _ => {
      res.json(_);
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});




// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});

app.use('/', apiRouter);


