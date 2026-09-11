require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const rawPk = process.env.PRIVATE_KEY || "";
const accounts = rawPk ? [rawPk.startsWith("0x") ? rawPk : `0x${rawPk}`] : [];

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
    botchain: {
      url: "https://rpc.botchain.ai",
      accounts: accounts,
      chainId: 677
    },
    botchainTestnet: {
      url: "https://rpc.bohr.life",
      accounts: accounts,
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
        chainId: 677,
        urls: {
          apiURL: "https://scan.botchain.ai/api",
          browserURL: "https://scan.botchain.ai"
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  }
};
