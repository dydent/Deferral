export enum CoinGeckoIds {
  bsc = "binancecoin",
  mainnet = "ethereum",
  "polygon-mainnet" = "matic-network",
  "arbitrum-mainnet" = "arbitrum",
  "optimism-mainnet" = "optimism",
  avalanche = "avalanche-2",
  goerli = "goerli-eth",
}

export type CoinGeckoIdsType = CoinGeckoIds;

export enum CoinGeckoSymbols {
  bsc = "bnb",
  mainnet = "eth",
  "polygon-mainnet" = "matic",
  // uses ETH as default units to pay gas fees
  "arbitrum-mainnet" = "eth",
  // uses ETH as default units to pay gas fees
  "optimism-mainnet" = "eth",
  avalanche = "avax",
  goerli = "geth",
}

export type CoinGeckoSymbolsType = CoinGeckoSymbols;

export enum CoinGeckoCurrencies {
  USD = "usd",
  EUR = "eur",
  GBP = "gbp",
  JPY = "jpy",
  CNY = "cny",
  KRW = "krw",
  BTC = "btc",
  ETH = "eth",
  BNB = "bnb",
  USDT = "usdt",
  DOGE = "doge",
}

export type CoinGeckoCurrencyTypes = CoinGeckoCurrencies;
