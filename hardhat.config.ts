import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-gas-reporter";
import { CHAIN_IDS } from "./helpers/constants/chain-ids";
import { getChainConfig } from "./helpers/get-chain-configs";

dotenv.config();

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const mnemonic: string | undefined = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("Please set the MNEMONIC in a .env file");
}

const USE_HD_WALLET_ACCOUNTS: boolean = true;

// API for gas prices
const GAS_PRICE_API = `https://api.etherscan.io/api?module=proxy&action=eth_gasPrice`;

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
    hardhat: {
      accounts: {
        mnemonic,
      },
      chainId: CHAIN_IDS.hardhat,
    },
    ganache: getChainConfig({
      chain: "ganache",
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    arbitrum: getChainConfig({
      chain: "arbitrum-mainnet",
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    avalanche: getChainConfig({
      chain: "avalanche",
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    bsc: getChainConfig({
      chain: "bsc",
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    mainnet: getChainConfig({
      chain: "mainnet",
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    optimism: getChainConfig({
      chain: "optimism-mainnet",
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    "polygon-mainnet": getChainConfig({
      chain: "polygon-mainnet",
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    "polygon-mumbai": getChainConfig({
      chain: "polygon-mumbai",
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    sepolia: getChainConfig({
      chain: "sepolia",
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: !!process.env.REPORT_GAS,
    currency: "CHF",
    // !!! for accurate gas reporter output --> run test files one by one and exclude not needed contracts here !!!
    // excludeContracts: ["V1ReferralPaymentProxy"],
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    gasPriceApi: GAS_PRICE_API,
    // proxyResolver,
    // gasPrice: 34,
    // outputFile:
  },
};

export default config;
