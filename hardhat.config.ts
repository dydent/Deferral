import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-gas-reporter";
import { CHAIN_IDS } from "./helpers/constants/chain-ids";
import { getChainConfig } from "./helpers/get-chain-configs";
import { resolve } from "path";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const mnemonic: string | undefined = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("Please set the MNEMONIC in a .env file");
}

const USE_HD_WALLET_ACCOUNTS: boolean = true;

// API for gas prices
const GAS_PRICE_API = `https://api.etherscan.io/api?module=proxy&action=eth_gasPrice`;

// Generated Accounts by Hardhat with the private keys using a mnemonic phrase of 12 words
export const HD_WALLET_ACCOUNTS = {
  count: 20,
  mnemonic,
  path: "m/44'/60'/0'/0",
};

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
    // LOCAL GANACHE NETWORK
    ganache: getChainConfig({
      chain: "ganache",
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    // !!! ARBITRUM MAINNET !!!
    arbitrum: getChainConfig({
      chain: "arbitrum-mainnet",
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    // !!! AVALANCHE MAINNET !!!
    avalanche: getChainConfig({
      chain: "avalanche",
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    // !!! BINANCE SMART CHAIN (BSC) MAINNET !!!
    bsc: getChainConfig({
      chain: "bsc",
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    // !!! ETHEREUM MAINNET !!!
    mainnet: getChainConfig({
      chain: "mainnet",
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    // !!! OPTIMISM MAINNET !!!
    optimism: getChainConfig({
      chain: "optimism-mainnet",
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    // !!! POLYGON MAINNET !!!
    "polygon-mainnet": getChainConfig({
      chain: "polygon-mainnet",
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    // POLYGON TESTNET
    "polygon-mumbai": getChainConfig({
      chain: "polygon-mumbai",
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    //
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
    currency: "USD",
    // !!! for accurate gas reporter output --> run test files one by one and exclude not needed contracts here !!!
    // excludeContracts: ["V1ReferralPaymentProxy"],
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    gasPriceApi: GAS_PRICE_API,
    // proxyResolver,
    // gasPrice: 34,
    // outputFile:
  },
  // typechain: {
  //   outDir: "types",
  //   target: "ethers-v5",
  // },
};

export default config;
