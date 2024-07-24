const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// data:,{"p":"fast-20","op":"deploy","tick":"fast","max":"21000000","lim":"2","premine":"10"}
// data:,{"p":"fast-20","op":"deploy","tick":"fast","sb":"1596358","eb":"3000000","lim":"2","premine":"10"}

const DeploySchema = new mongoose.Schema({
    blockNumber: {
        type: Number,
        required: true
    },
    transactionHash: {
        type: String,
        required: true,
        unique: true
    },
    from: {
        type: String,
        required: false
    },
    to: {
        type: String,
        required: false
    },
    name: {
        type: String,
        required: true
    },
    max: {
        type: Number, default: 0,
        required: false
    },
    lim: {
        type: Number,
        required: false
    },
    startBlock: {
        type: Number, default: 0,
        required: false
    },
    endBlock: {
        type: Number, default: 0,
        required: false
    },
    blockTime: {
        type: Number,
        required: true
    },
    completedTime: {
        type: Number,
        required: false
    },
    premine: {
        type: Number, default: 0,
        required: false
    },
    description: {
        type: String,
        required: false,
    },
    twitterlink: {
        type: String, default: "#",
        required: false,
    },
    logo: {
        type: String,
        required: true,
        unique: true
    },

    alreadyPremine: {
        type: Boolean, default: false,
        required: false
    },
    remain: {
        type: Number, default: 0,
        required: false
    },
    premineHash: {
        type: String, default: '',
        required: false,
        unique: true
    },
    burnSupply: {
        type: Number, default: 0,
        required: false
    },
    mintOver: {
        type: Boolean, default: false,
        required: false
    },
});

DeploySchema.set('toJSON', {
    transform: function (doc, ret, options) {
        delete ret._id; // Exclude the _id field from the result
        return ret;
    }
});

const Deploy = mongoose.model('Deploy', DeploySchema);
module.exports = Deploy;

module.exports.getDeployByUser = (_from) => {
    return new Promise((resolve) => {
        const query = {from: _from};
        let result = Deploy.find(query, {timeout: false}).sort({blockNumber: -1});
        resolve(result);
    })
};

/*
Kermit
We are not affiliate with any another individual or organization in their profile or posts.
https://x.com/Kermit0x99
https://s2.coinmarketcap.com/static/img/coins/64x64/31820.png
100000000
*/

module.exports.getTokenByName = (_name) => {
    return new Promise((resolve, reject) => {
        const query = {name: _name};
        let result = Deploy.findOne(query, {timeout: false}).sort({blockNumber: -1});
        resolve(result);
    });
};

module.exports.chekLogoLink = (_logo) => {
    return new Promise((resolve) => {
        const query = {logo: _logo};
        let result = Deploy.findOne(query, {timeout: false}).sort({blockNumber: -1});
        resolve(result);
    })
};

module.exports.getMyDeploy = (_from) => {
    return new Promise((resolve) => {
        const query = {from: _from};
        let result = Deploy.find({query}, {timeout: false}).sort({blockNumber: -1});
        resolve(result);
    })
};

module.exports.getAllDeploy = () => {
    return new Promise((resolve) => {

        let result = Deploy.find({}, {timeout: false}).sort({blockNumber: -1});
        resolve(result);
    })
};

module.exports.setPremine = (_transactionHash, _from) => {
    return new Promise((resolve) => {
        const query = {transactionHash: _transactionHash, from: _from};
        const newValues = {$set: {alreadyPremine: true}};
        let result = Deploy.updateOne(query, newValues);
        resolve(result);
    })
};

module.exports.updateDeployInfo = (_transactionHash, _from, _description, _twitterlink, _logo) => {
    return new Promise((resolve) => {
        const query = {transactionHash: _transactionHash, from: _from};
        const newValues = {$set: {description: _description, twitterlink: _twitterlink, logo: _logo}};
        let result = Deploy.updateOne(query, newValues);
        resolve(result);
    })
};

module.exports.getUpComingMint = (currentBlock) => {
    return new Promise(async (resolve, reject) => {
        try {
            let results = await Deploy.find({ 
                $and: [
                    { startBlock: { $gt: 0 } },
                    { endBlock: { $gt: 0 } },
                    { startBlock: { $gt: currentBlock } }
                ]
            }).sort({ blockNumber: -1 });
            resolve(results);
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
}

module.exports.getOnGoingMint = (currentBlock) => {
    return new Promise(async (resolve, reject) => {
        try {
            let results = await Deploy.find({
                $or: [
                    { $and: [{ startBlock: { $lte: currentBlock } }, { endBlock: { $gte: currentBlock } }] },
                    { remain: { $gt: 0 } }
                ]
            }).sort({ blockNumber: -1 });
            resolve(results);
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
}

module.exports.getPassedMint = (currentBlock) => {
    return new Promise(async (resolve, reject) => {
        try {
            let results = await Deploy.find({
                $or: [
                    {
                        $and: [
                            { endBlock: { $lt: currentBlock } },
                            { startBlock: { $gt: 0 } },
                            { endBlock: { $gt: 0 } }
                        ]
                    },
                    {
                        $and: [
                            { remain: { $lte: 0 } },
                            { startBlock: { $lte: 0 } },
                            { endBlock: { $lte: 0 } }
                        ]
                    }
                ]
            }).sort({ blockNumber: -1 });
            resolve(results);
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });   
}

