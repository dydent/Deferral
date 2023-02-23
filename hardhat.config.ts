import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";

dotenv.config();

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

// chain urls
// const GANACHE_URL = "http://127.0.0.1:7545";
// const UZH_URL = "http://130.60.244.246:8545";

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
      url: "http://localhost:8545",
      chainId: 1337,
    },
    sepolia: {
      url: `https://eth-sepolia-rpc.avax-test.network`,
      chainId: 43113,
    },

    // uzh: {
    //   url: UZH_URL,
    //   accounts: [
    //     ...(process.env.UZH_PRIVATE_KEY ? [process.env.UZH_PRIVATE_KEY] : []),
    //     ...(process.env.UZH_PRIVATE_KEY_2
    //       ? [process.env.UZH_PRIVATE_KEY_2]
    //       : []),
    //   ],
    // },
  },
};

export default config;
