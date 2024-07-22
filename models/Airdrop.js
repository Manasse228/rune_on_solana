const mongoose = require('mongoose');

const AirdropSchema = new mongoose.Schema({
    transactionHash: {
        type: String,
        required: true
    },
    from: {
        type: String,
        required: true
    },
    tos: {
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

const Airdrop = mongoose.model('Airdrop', AirdropSchema);
module.exports = Airdrop;