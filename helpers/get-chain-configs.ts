import { CHAIN_IDS } from "./constants/chain-ids";
import { NetworkUserConfig } from "hardhat/types";
import {
  GANACHE_ACCOUNTS,
  HD_WALLET_ACCOUNTS,
  METAMASK_ACCOUNTS,
} from "./constants/accounts";

// -----------------------------------------------------------------------------------------------
// helper functions for configuring the different chains in the hardhat.config.ts file
// -----------------------------------------------------------------------------------------------

const GANACHE_URL = "HTTP://127.0.0.1:7545";

const infuraApiKey: string | undefined = process.env.INFURA_API_KEY;
if (!infuraApiKey) {
  throw new Error("Please set the INFURA_API_KEY in a .env file");
}

export const getChainConfig = ({
  chain,
  hdWalletAccounts,
}: {
  chain: keyof typeof CHAIN_IDS;
  hdWalletAccounts?: boolean;
}): NetworkUserConfig => {
  let jsonRpcUrl: string;
  let accounts = METAMASK_ACCOUNTS;
  switch (chain) {
    case "ganache":
      jsonRpcUrl = GANACHE_URL;
      accounts = GANACHE_ACCOUNTS as string[];
      break;
    case "avalanche":
      jsonRpcUrl = "https://api.avax.network/ext/bc/C/rpc";
      break;
    case "bsc":
      jsonRpcUrl = "https://bsc-dataseed1.binance.org";
      break;
    default:
      jsonRpcUrl = "https://" + chain + ".infura.io/v3/" + infuraApiKey;
  }
  return {
    chainId: CHAIN_IDS[chain],
    url: jsonRpcUrl,
    accounts: hdWalletAccounts ? HD_WALLET_ACCOUNTS : accounts,
  };
};
