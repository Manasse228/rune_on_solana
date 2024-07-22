const mongoose = require('mongoose');
const userName = "manasse";
const password = "qwPNZBgkxfhF4Ox3";
const database = "colibri";
const port = ".mongodb.net/";
const host = "@runes.t4qtazw";

const dbUrl = "mongodb+srv://" + userName + ":" + password + host + port + "?retryWrites=true&w=majority";
              //"mongodb+srv://manasse:<password>@colibri.klpntii.mongodb.net/?retryWrites=true&w=majority"
//const dbUrl = process.env.DB_URL;

mongoose.connect(dbUrl).catch(err => console.log("Could not connect", err));
// In order to remove deprecated warning collection.ensureIndex is deprecated. Use createIndexes instead.
//mongoose.set('useCreateIndex', true);

//Get the default connection
const db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
//db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function () {
    console.log("Connexion à la base OK ");
});

module.exports = db;



