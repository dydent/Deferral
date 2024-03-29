import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

// -----------------------------------------------------------------------------------------------
// constants and helpers for generating and using accounts
// -----------------------------------------------------------------------------------------------
const ACCOUNT_COUNT = 20;

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "../../.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });

// Ensure that we have all the environment variables we need.
const mnemonic: string | undefined = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("Please set the MNEMONIC in a .env file");
}

// Metamask env variables
const metamaskPk1: string | undefined = process.env.METAMASK_PK1;
if (!metamaskPk1) {
  throw new Error("Please set the METAMASK_PK1 in a .env file");
}
const metamaskPk2: string | undefined = process.env.METAMASK_PK2;
if (!metamaskPk2) {
  throw new Error("Please set the METAMASK_PK2 in a .env file");
}
const metamaskPk3: string | undefined = process.env.METAMASK_PK3;
if (!metamaskPk3) {
  throw new Error("Please set the METAMASK_PK3 in a .env file");
}
const metamaskPk4: string | undefined = process.env.METAMASK_PK4;
if (!metamaskPk4) {
  throw new Error("Please set the METAMASK_PK3 in a .env file");
}

// Generated Accounts by Hardhat with the private keys using a mnemonic phrase of 12 words
export const HD_WALLET_ACCOUNTS = {
  count: ACCOUNT_COUNT,
  mnemonic,
  path: "m/44'/60'/0'/0",
};

// List of PKs taken from existing Metamask wallets
export const METAMASK_ACCOUNTS = [
  metamaskPk1,
  metamaskPk2,
  metamaskPk3,
  metamaskPk4,
];

// List of PKs taken form local Ganache workspace
export const GANACHE_ACCOUNTS = [
  process.env.GANACHE_PK1,
  process.env.GANACHE_PK2,
  process.env.GANACHE_PK3,
  process.env.GANACHE_PK4,
];
