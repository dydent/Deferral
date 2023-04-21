import { CoinGeckoIds, CoinGeckoSymbols } from "../../types/ChainTypes";
import { EvaluationChainDataType } from "../../types/EvaluationTypes";

// -----------------------------------------------------
// Evaluation Chains Data for the Evaluation Scripts
// Note: if this object is types and scripts must also be updated!
// -----------------------------------------------------

export const EVALUATION_CHAIN_DATA: EvaluationChainDataType = {
  bsc: {
    chain: "binance",
    coinGeckoId: CoinGeckoIds.bsc,
    defaultUnitName: CoinGeckoSymbols.bsc,
  },
  mainnet: {
    chain: "ethereum",
    coinGeckoId: CoinGeckoIds.mainnet,
    defaultUnitName: CoinGeckoSymbols.mainnet,
  },
  "polygon-mainnet": {
    chain: "polygon",
    coinGeckoId: CoinGeckoIds["polygon-mainnet"],
    defaultUnitName: CoinGeckoSymbols["polygon-mainnet"],
  },
  "arbitrum-mainnet": {
    chain: "arbitrum-mainnet",
    coinGeckoId: CoinGeckoIds["arbitrum-mainnet"],
    defaultUnitName: CoinGeckoSymbols["arbitrum-mainnet"],
  },
  "optimism-mainnet": {
    chain: "optimism-mainnet",
    coinGeckoId: CoinGeckoIds["optimism-mainnet"],
    defaultUnitName: CoinGeckoSymbols["optimism-mainnet"],
  },
  avalanche: {
    chain: "avalanche",
    coinGeckoId: CoinGeckoIds.avalanche,
    defaultUnitName: CoinGeckoSymbols.avalanche,
  },
  goerli: {
    chain: "goerli",
    coinGeckoId: CoinGeckoIds.goerli,
    defaultUnitName: CoinGeckoSymbols.goerli,
  },
};
