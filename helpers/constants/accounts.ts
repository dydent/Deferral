import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "../../.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });

// Ensure that we have all the environment variables we need.
const mnemonic: string | undefined = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("Please set the MNEMONIC in a .env file");
}

// Generated Accounts by Hardhat with the private keys using a mnemonic phrase of 12 words
export const HD_WALLET_ACCOUNTS = {
  count: 20,
  mnemonic,
  path: "m/44'/60'/0'/0",
};

// List of PKs taken from existing Metamask wallets
export const METAMASK_ACCOUNTS = [
  ...(process.env.METAMASK_PK1 ? [process.env.METAMASK_PK1] : []),
  ...(process.env.METAMASK_PK2 ? [process.env.METAMASK_PK2] : []),
  ...(process.env.METAMASK_PK3 ? [process.env.METAMASK_PK3] : []),
  ...(process.env.METAMASK_PK4 ? [process.env.METAMASK_PK4] : []),
];

// List of PKs taken form local Ganache workspace
export const GANACHE_ACCOUNTS = [
  ...(process.env.GANACHE_PK1 ? [process.env.GANACHE_PK1] : []),
  ...(process.env.GANACHE_PK2 ? [process.env.GANACHE_PK2] : []),
  ...(process.env.GANACHE_PK3 ? [process.env.GANACHE_PK3] : []),
  ...(process.env.GANACHE_PK4 ? [process.env.GANACHE_PK4] : []),
];
