const mongoose = require('mongoose');

const UserBalanceSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true
    },
    tokenName: {
        type: String,
        required: true
    },
    balance: {
        type: Number, default: 0,
        required: false
    }
});

const UserBalance = mongoose.model('UserBalance', UserBalanceSchema);
module.exports = UserBalance;

module.exports.getBalance_ByWallet_AndByTick = (_address, _tick) => {
    return new Promise((resolve) => {
        const query = {
            address: _address,
            tokenName: _tick
        };
        let result = UserBalance.find(query, {timeout: false});
        resolve(result);
    });
}


module.exports.check = (_address, _tick) => {
    return new Promise((resolve) => {
        const query = {
            address: _address,
            tick: _tick,
        };
        let result = UserBalance.findOne(query, {timeout: false});
        resolve(result);
    });
}

module.exports.updateBalanceValue = (_address, _tick, _newValue) => {
    return new Promise((resolve) => {
        const query = {
            address: _address,
            tick: _tick,
        };
        const newValues = {$set: {balance: _newValue}};
        let result = UserBalance.updateOne(query, newValues);
        resolve(result);
    })
};

module.exports.countHolderByTokenname = (_tick) => {
    return new Promise((resolve) => {
        const query = {
            address: _address,
            tick: _tick,
        };
        const newValues = {$set: {balance: _newValue}};
        let result = UserBalance.updateOne(query, newValues);
        resolve(result);
    })
};

module.exports.incrementBalance = (_address, _tick, _newValue) => {
    return new Promise((resolve, reject) => {
        const query = {
            address: _address,
            tokenName: _tick,
        };
        const newValues = {$inc: {balance: _newValue}};
        const options = {upsert: true}; // Ensure creation if not exists

        UserBalance.updateOne(query, newValues, options)
            .then(result => resolve(result))
            .catch(error => reject(error)); // Properly handle errors
    })
};

module.exports.decrementBalance = (_address, _tick, _newValue) => {
    return new Promise((resolve, reject) => {
        const query = {
            address: _address,
            tokenName: _tick,
        };
        const newValues = { $inc: { balance: -_newValue } };
        const options = {}; 

        UserBalance.updateOne(query, newValues, options)
            .then(result => resolve(result))
            .catch(error => reject(error)); // Properly handle errors
    });
};
