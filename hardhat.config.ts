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

const RUNS = 10000;

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

// Ethereum -> Token: ETH
const ETH_GAS_PRICE_API = `https://api.etherscan.io/api?module=proxy&action=eth_gasPrice`;
// Polygon -> Token: MATIC
// const POLYGON_GAS_PRICE_API = `https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice`;
// Binance -> Token: BNB
// const BINANCE_GAS_PRICE_API = `https://api.bscscan.com/api?module=proxy&action=eth_gasPrice`;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        runs: RUNS,
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
    // GOERLI TESTNET
    goerli: getChainConfig({
      chain: "goerli",
      // accounts: [...METAMASK_ACCOUNTS],
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    // LOCAL GANACHE NETWORK
    ganache: getChainConfig({
      chain: "ganache",
      // accounts: [...METAMASK_ACCOUNTS],
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    // !!! ARBITRUM MAINNET !!!
    arbitrum: getChainConfig({
      chain: "arbitrum-mainnet",
      // accounts: [...METAMASK_ACCOUNTS],
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    // !!! AVALANCHE MAINNET !!!
    avalanche: getChainConfig({
      chain: "avalanche",
      // accounts: [...METAMASK_ACCOUNTS],
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    // !!! BINANCE SMART CHAIN (BSC) MAINNET !!!
    bsc: getChainConfig({
      chain: "bsc",
      // accounts: [...METAMASK_ACCOUNTS],
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    // !!! ETHEREUM MAINNET !!!
    mainnet: getChainConfig({
      chain: "mainnet",
      // accounts: [...METAMASK_ACCOUNTS],
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    // !!! OPTIMISM MAINNET !!!
    optimism: getChainConfig({
      chain: "optimism-mainnet",
      // accounts: [...METAMASK_ACCOUNTS],
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    // !!! POLYGON MAINNET !!!
    "polygon-mainnet": getChainConfig({
      chain: "polygon-mainnet",
      // accounts: [...METAMASK_ACCOUNTS],
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    // POLYGON TESTNET
    "polygon-mumbai": getChainConfig({
      chain: "polygon-mumbai",
      // accounts: [...METAMASK_ACCOUNTS],
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    //
    sepolia: getChainConfig({
      chain: "sepolia",
      // accounts: [...METAMASK_ACCOUNTS],
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
    excludeContracts: [
      // "V1ReferralPaymentTransmitter",
      // "UpgradableV1ReferralPaymentTransmitter",
      // "UpgradableV2ReferralPaymentTransmitter",
      // "V2MultilevelRewardReferralUpgradable",
      // "V1ReferralPaymentEvaluatorUpgradable",
      // "V1ReferralQuantityPaymentUpgradable",
      // "V2ReferralQuantityPaymentUpgradable",
      // "V1ReferralPaymentValueUpgradable",
      // "V2ReferralPaymentValueUpgradable",
      // "V1MultilevelRewardReferralUpgradable",
      // "V2MultilevelRewardReferralUpgradable",
    ],
    showTimeSpent: false,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    gasPriceApi: ETH_GAS_PRICE_API,
    token: "ETH",
    outputFile: `gas-reporter-logs/gasReporterOutput-${RUNS}.txt`,
    // gasPrice: 34,

    // proxyResolver,
  },
  // typechain: {
  //   outDir: "types",
  //   target: "ethers-v5",
  // },
};

export default config;
