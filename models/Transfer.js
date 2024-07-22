const mongoose = require('mongoose');

const TransferSchema = new mongoose.Schema({
    transactionHash: {
        type: String,
        required: true
    },
    from: {
        type: String,
        required: true
    },
    to: {
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

const Transfer = mongoose.model('Transfer', TransferSchema);
module.exports = Transfer;