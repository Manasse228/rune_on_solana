const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MintSchema = new mongoose.Schema({
    transactionHash: {
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
    tokenAmount: {
        type: Number, default: 0,
        required: true
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

MintSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        delete ret._id; // Exclude the _id field from the result
        return ret;
    }
});

const Mint = mongoose.model('Mint', MintSchema);
module.exports = Mint;

module.exports.getAllMint = () => {
    return new Promise((resolve) => {
        const query = {};
        let result = Mint.find(query, {timeout: false});
        resolve(result);
    })
};

module.exports.getMint_ByWallet_AndByTick = (_address, _tick) => {
    return new Promise((resolve) => {
        const query = {
            to: _address,
            tokenName: _tick,
        };
        let result = Mint.find(query, {timeout: false});
        resolve(result);
    });
}

module.exports.getMint_ByWallet = (_address) => {
    return new Promise((resolve) => {
        const query = {
            to: _address
        };
        let result = Mint.find(query, {timeout: false});
        resolve(result);
    });
}

module.exports.getMint_ByTick = (_tick) => {
    return new Promise((resolve) => {
        const query = {
            tick: _tick
        };
        let result = Mint.find(query, {timeout: false});
        resolve(result);
    });
}


module.exports.checkTransactionHash = (_hash) => {
    return new Promise((resolve) => {
        const query = {
            transactionHash: _hash
        };
        let result = Mint.findOne(query, {timeout: false});
        resolve(result);
    });
}


module.exports.sumOfMint = (_tick) => {
    return new Promise((resolve) => {
        Mint.aggregate([
            {
                $match: {
                    tick: _tick
                }
            },
            {
                $group: {
                    _id: null, // Groupe sans critère spécifique
                    totalAmount: {$sum: "$tokenAmount"}
                }
            }
        ])
            .then(result => {
                if (result.length > 0) {
                    //console.log('La somme totale du champ "amount" pour les critères donnés est:', result[0].totalAmount);
                    resolve(result[0].totalAmount);
                } else {
                    resolve(0);
                }
            })
            .catch(err => {
                console.error('Erreur lors du calcul de la somme:', err);
                resolve(0);
            });
    });
}