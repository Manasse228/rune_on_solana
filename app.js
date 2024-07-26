const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoConf = require('./config/mongoDB');
const tokenCtrl = require('./router/TokenCtrl');
const userCtrl = require('./router/UserCtrl');


const apiRouter = require('./apiRouter').router;
const cors = require('cors');//evite les erreurs Cross-Allow-Origin

const app = express();
const port = 3000;




userCtrl.initAdminCreation();
//tokenCtrl.close_fairmint();


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

app.get('/explorer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'explorer.html'));
});

app.get('/token', (req, res) => {
  const tokenName = req.query.name;
  if (tokenName) {
    res.sendFile(path.join(__dirname, 'public', 'token.html'));
  } else {
    res.redirect('/mint');
  }
});



// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});

app.use('/', apiRouter);


