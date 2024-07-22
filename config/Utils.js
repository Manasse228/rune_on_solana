const UserModel = require('../models/User');

module.exports = {
    getChain: () => {
        return {
            avalancheTestnet: "https://api.avax-test.network/ext/bc/C/rpc",
            avalancheMainet: "https://api.avax.network/ext/bc/C/rpc",
            gnosisMainet: "https://rpc.gnosischain.com",
        };
    },
    getColdWallet: () => {
        return { // put private key
            colibri: "0ba888b4c4c2ea291f0ad60cf97112f2f24c6f36e832814441073bda9df3b93f",
            colibri2: "0xe846b95de4c88265d7264339235e5395a8531309a618591153e9a3955fe7573b",
        };
    },
    pickAddress: () => {
        const addresses = {
            tokyo: { privateKey: "0x161221f50a485faef7084d255ce94dd7dab63b40ef2e535d07281f1379b1dbba", publicKey: "0x22342800d846fe537fc7373ba153e7a05eaa8456" },
            lisbone: { privateKey: "0x95941f7452b2088f93657207546fb7f129ef9d3bd67a86541771648c2e1af69b", publicKey: "0x4A9483D13045f11e49ce78Fd2B8e2384114947DD" },
            mango: { privateKey: "0x5b712a0ff70f0c5d04d5c68c5a1d85f00b58b3a8db40cc5754973f302e54e2b6", publicKey: "0x485ed14157ac4606d6f01ffe8e971f55d132acb0" },
            dapaong: { privateKey: "0xca96197d80c5a66f4cf35f6905ad4c0a36348842081f367c58e2179f8919e526", publicKey: "0x7ea160e6135792fc451f0a91c5b4b5a6211beba3" },
            tsevie: { privateKey: "0xe846b95de4c88265d7264339235e5395a8531309a618591153e9a3955fe7573b", publicKey: "0xbb2d0027217514a7457dfa02301b0525b080bef9" }
        };

        const keys = Object.keys(addresses);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];

        return addresses[randomKey];
    },
    getFreeHouse: () => {
        return "0x793C6260505ECeD5E4f6848324B73c12A6680A2e";
    },
    getFruit: () => {
        const fruits = ['Pomme🍏', 'Banane 🍌', 'Orange 🍊', 'Raisin 🍇', 'Fraise 🍓', 'Cerise', 'Mangue', 'Ananas', 'Pêche', 'Poire', 'Citron 🍋', 'Melon', 'Pastèque 🍉', 'Banane Plantin', 'Fruit de la passion'];
        const index = Math.floor(Math.random() * fruits.length);
        return fruits[index];
    },
    formatInscription: (dataObj) => {
        return `data:,${JSON.stringify(dataObj)}`;
    },
    stringToHex: (str) => {
        return Buffer.from(str, 'utf8').toString('hex');
    },
    genererChaineAleatoire: (size) => {
        const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let resultat = '';
        for (let i = 0; i < size; i++) {
            resultat += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
        }
        return resultat;
    },
    generateNumbers: () => {
        // Générer un chiffre pour le total supply, entre 1 million et 100 millions, arrondi aux millions
        const totalSupply = Math.floor(Math.random() * 100 + 1) * 1000000;

        // Générer un deuxième chiffre entre 1 et 10
        const secondNumber = Math.floor(Math.random() * 10 + 1);

        return {totalSupply, secondNumber};
    },
    getErrors: (res, err) => {
        return module.exports.getJsonResponse('error', 400, err.array().filter(function (item) {
            delete item.value;
            delete item.location;
            delete item.param;
            return item;
        })[0].msg, '', res);
    },
    getDigicode(length) {
        let result = '';
        const characters = '123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    },
    getJsonResponse: (status, errorcode, errortext, data, res) => {
        res.json({
            status: status,
            errorcode: errorcode,
            errortext: errortext,
            data: data,
        });
    },
    checkAuthentication: async (req, res, jwt) => {
        const token = (req.headers.authorization) ? req.headers.authorization : (req.body.authorization || req.body.Authorization);
        return new Promise((resolve, reject) => {
            if (token) {
                jwt.verify(token, module.exports.getSecret(), (err, decoded) => {
                    if (err) {
                        return module.exports.getJsonResponse('error', 404, 'Invalid Token', '', res);
                    } else {
                        UserModel.checkUserToken(token, async (err, user) => {
                            if (err || !user) {
                                return module.exports.getJsonResponse('error ', 404, 'Invalid Token', '', res);
                            }
                            resolve(user, req.decoded = decoded);
                        });
                    }
                });
            } else {
                return module.exports.getJsonResponse('error', 401, 'Put Token please', '', res);
            }
        })
    },
    getSecret: () => {
        return "dQE#o75455ssfdsfdsgd@/ty.DeployMemeFi@qsdfiugsdfp#{[^@`.ps859632478";
    },
    getNetwork: () => {
        return {
            avalancheFuji: "http://51.195.202.211:9650/ext/bc/C/rpc/",
            avalancheMainet: "",
            avalancheTestnetInfura: "http://51.195.202.211:9650/ext/bc/C/rpc",
            // avalancheTestnetInfura: "https://avalanche-fuji.infura.io/v3/9881644eecfe4b7cbd207746e76d2b7c",
            avalancheMainetInfura: "https://avalanche-mainnet.infura.io/v3/4ac6fc931b6d4d9fa479bf98b5f30e24",
        }
    },

}

