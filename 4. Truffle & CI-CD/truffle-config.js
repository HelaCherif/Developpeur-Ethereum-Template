require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const {MNEMONIC, INFURA_ID} = process.env;

module.exports = {
    networks: {
        development: {
            host: "127.0.0.1",     // Localhost (default: none)
            port: 8545,            // Standard Ethereum port (default: none)
            network_id: "*",       // Any network (default: none)
        },
        goerli: {
            provider: function () {
                return new HDWalletProvider({
                    mnemonic: {phrase: `${MNEMONIC}`},
                    providerOrUrl: `https://goerli.infura.io/v3/${INFURA_ID}`
                })
            },
            network_id: 5,
        }
    },

    // Set default mocha options here, use special reporters, etc.
    mocha: {

    },

    compilers: {
        solc: {
            version: "0.8.17" // Fetch exact version from solc-bin (default: truffle's version)
            // settings: {          // See the solidity docs for advice about optimization and evmVersion
            //  optimizer: {
            //    enabled: false,
            //    runs: 200
            //  },
            // }
        }
    }

};