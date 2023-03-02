import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import "@openzeppelin/hardhat-upgrades";

dotenv.config();

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

// chain urls
const GANACHE_URL = "HTTP://127.0.0.1:7545";
const SEPOLIA_URL = `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`;
const GOERLI_URL = `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        runs: 200,
        enabled: true,
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    ganache: {
      url: GANACHE_URL,
      chainId: 1337,
      accounts: [
        ...(process.env.GANACHE_PRIVATE_KEY
          ? [process.env.GANACHE_PRIVATE_KEY]
          : []),
        ...(process.env.GANACHE_SECOND_PRIVATE_KEY
          ? [process.env.GANACHE_SECOND_PRIVATE_KEY]
          : []),
      ],
    },
    goerli: {
      url: GOERLI_URL,
      chainId: 5,
      accounts: [
        ...(process.env.DEPLOYER_OWNER_PK
          ? [process.env.DEPLOYER_OWNER_PK]
          : []),
        ...(process.env.RECEIVER_COMPANY_PK
          ? [process.env.RECEIVER_COMPANY_PK]
          : []),
        ...(process.env.REFERRER_PK ? [process.env.REFERRER_PK] : []),
        ...(process.env.REFEREE_PK ? [process.env.REFEREE_PK] : []),
      ],
    },
    sepolia: {
      url: SEPOLIA_URL,
      chainId: 43113,
      accounts: [
        ...(process.env.DEPLOYER_OWNER_PK
          ? [process.env.DEPLOYER_OWNER_PK]
          : []),
        ...(process.env.RECEIVER_COMPANY_PK
          ? [process.env.RECEIVER_COMPANY_PK]
          : []),
        ...(process.env.REFERRER_PK ? [process.env.REFERRER_PK] : []),
        ...(process.env.REFEREE_PK ? [process.env.REFEREE_PK] : []),
      ],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
