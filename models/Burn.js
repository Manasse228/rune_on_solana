const mongoose = require('mongoose');

const BurnSchema = new mongoose.Schema({
    transactionHash: {
        type: String,
        required: true
    },
    from: {
        type: String,
        required: true
    },
    tokenName: {
        type: String,
        required: true
    },
    amount: {
        type: Number, default: 0,
        required: false
    },
    blockTime: {
        type: Number,
        required: true
    },
    blockNumber: {
        type: Number,
        required: true
    },
});

const Burn = mongoose.model('Burn', BurnSchema);
module.exports = Burn;