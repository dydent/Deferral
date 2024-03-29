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
import { HardhatNetworkHDAccountsUserConfig } from "hardhat/src/types/config";

// Config for solidity optimizer
// -----------------------------------------------------------------------------------------------
const RUNS = 200;

// Config for dotenv
// -----------------------------------------------------------------------------------------------
const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const mnemonic: string | undefined = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("Please set the MNEMONIC in a .env file");
}

// Config for accounts
// -----------------------------------------------------------------------------------------------
const USE_HD_WALLET_ACCOUNTS: boolean = !!process.env.USE_EVALUATION_ACCOUNTS;

// Config for evaluation scripts
// -----------------------------------------------------------------------------------------------
const NR_OF_EVALUATION_ACCOUNTS: string | undefined =
  process.env.NUMBER_OF_EVALUATION_ACCOUNTS;

// Config for Hardhat accounts
// -----------------------------------------------------------------------------------------------
const DEFAULT_NR_OF_HARDHAT_ACCOUNTS: number = 20;
export let HARDHAT_ACCOUNTS_COUNT: number = DEFAULT_NR_OF_HARDHAT_ACCOUNTS;

if (
  process.env.USE_EVALUATION_ACCOUNTS === "true" &&
  NR_OF_EVALUATION_ACCOUNTS !== undefined
) {
  HARDHAT_ACCOUNTS_COUNT = parseInt(NR_OF_EVALUATION_ACCOUNTS);
}

const hardhatAccounts: HardhatNetworkHDAccountsUserConfig = {
  count: HARDHAT_ACCOUNTS_COUNT,
  mnemonic,
};

// Config APIs for gas prices in gas reporter
// -----------------------------------------------------------------------------------------------
// Ethereum -> Token: ETH
const ETH_GAS_PRICE_API = `https://api.etherscan.io/api?module=proxy&action=eth_gasPrice`;
// further options...
// Polygon -> Token: MATIC
// const POLYGON_GAS_PRICE_API = `https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice`;
// Binance -> Token: BNB
// const BINANCE_GAS_PRICE_API = `https://api.bscscan.com/api?module=proxy&action=eth_gasPrice`;

// HARDHAT CONFIGURATION
// -----------------------------------------------------------------------------------------------
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
  // SETUP SUPPORTED NETWORKS / CHAINS
  networks: {
    // LOCAL HARDHAT NETWORK CONFIG
    hardhat: {
      accounts: hardhatAccounts,
      chainId: CHAIN_IDS.hardhat,
    },
    // GOERLI TESTNET
    goerli: getChainConfig({
      chain: "goerli",
      // accounts: [...METAMASK_ACCOUNTS],
      hdWalletAccounts: USE_HD_WALLET_ACCOUNTS,
    }),
    // LOCAL GANACHE NETWORK --> requires to be set up and running local Ganache network on your machine
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
  // GAS REPORTER PLUGIN CONFIGURATION
  gasReporter: {
    enabled: !!process.env.REPORT_GAS,
    currency: "USD",
    // NOTE: for accurate gas reporter output --> run test files one by one and exclude not needed contracts here !!!
    // excludeContracts: [
    //   "V1ReferralPaymentQuantityUpgradable",
    //   "V2ReferralPaymentQuantityUpgradable",
    //   "V1ReferralPaymentTransmitter",
    //   "V3ReferralPaymentTransmitterUpgradable.sol",
    //   "V2ReferralPaymentTransmitterUpgradable.sol",
    //   "V1ReferralPaymentQuantityUpgradable.sol.sol",
    //   "V2ReferralPaymentQuantityUpgradable.sol.sol",
    //   "V1ReferralPaymentValueUpgradable",
    //   "V2ReferralPaymentValueUpgradable",
    //   "V3ReferralPaymentValueUpgradable",
    //   "V1ReferralMultilevelRewardsUpgradable.sol",
    //   "V1MultilevelTokenRewardsUpgradable.sol",
    //   // "V2ReferralMultilevelRewardsUpgradable.sol",
    // ],
    showTimeSpent: false,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    gasPriceApi: ETH_GAS_PRICE_API,
    token: "ETH",
  },
};

export default config;
