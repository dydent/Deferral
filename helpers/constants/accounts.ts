import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

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

// Metamask env variables
const ganachePk1: string | undefined = process.env.GANACHE_PK1;
if (!ganachePk1) {
  throw new Error("Please set the GANACHE_PK1 in a .env file");
}
const ganachePk2: string | undefined = process.env.GANACHE_PK2;
if (!ganachePk2) {
  throw new Error("Please set the GANACHE_PK2 in a .env file");
}

// Generated Accounts by Hardhat with the private keys using a mnemonic phrase of 12 words
export const HD_WALLET_ACCOUNTS = {
  count: 20,
  mnemonic,
  path: "m/44'/60'/0'/0",
};

// List of PKs taken from existing Metamask wallets
export const METAMASK_ACCOUNTS = [metamaskPk1, metamaskPk2];

// List of PKs taken form local Ganache workspace
export const GANACHE_ACCOUNTS = [ganachePk1, ganachePk2];
