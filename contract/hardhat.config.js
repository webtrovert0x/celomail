require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  paths: {
    artifacts: './src/artifacts',
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    alfajores: {
      url: "https://rpc.ankr.com/celo_sepolia",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11142220
    },
    botchain: {
      url: "https://rpc.bohr.life",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 968
    }
  },
  etherscan: {
    apiKey: {
      botchain: "abc"
    },
    customChains: [
      {
        network: "botchain",
        chainId: 968,
        urls: {
          apiURL: "https://scan.bohr.life/api",
          browserURL: "https://scan.bohr.life"
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  }
};
