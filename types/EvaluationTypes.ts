import { BigNumber } from "ethers";
import { EtherUnits } from "./ValidUnitTypes";
import {
  ChainType,
  CoinGeckoCurrencies,
  CoinGeckoIds,
  CoinGeckoSymbols,
} from "./ChainTypes";

// chain data type used for evaluation
export type EvaluationChainDataType = {
  [chain in ChainType]?: {
    chain: string;
    coinGeckoId: CoinGeckoIds;
    defaultUnitName: CoinGeckoSymbols;
  };
};

// type for getting the different gas prices of the chains used for evaluation
export type ChainGasPricesType<T> = {
  [chain in ChainType]: T;
};

// type for getting the different fiat prices of the chains used for evaluation
export type ChainFiatPriceType<T> = {
  [chain in ChainType]: T;
};

// based on EVALUATION_CHAIN_DATA: type for the gas costs of the different evaluation chains
export type ChainGasCostType<T> = {
  bscGasCost?: T;
  ethereumGasCost?: T;
  polygonMainnetGasCost?: T;
  arbitrumMainnetGasCost?: T;
  optimismMainnetGasCost?: T;
  avalancheGasCost?: T;
  goerliGasCost?: T;
};

// based on EVALUATION_CHAIN_DATA: type for the fiat costs of the different evaluation chains
export type ChainFiatCostType<T> = {
  bscFiatCost?: T;
  ethereumFiatCost?: T;
  polygonMainnetFiatCost?: T;
  arbitrumMainnetFiatCost?: T;
  optimismMainnetFiatCost?: T;
  avalancheFiatCost?: T;
  goerliFiatCost?: T;
};

// data that is recorded for evaluation of the transactions
export type TransactionEvaluationValuesType = {
  durationInMs: number;
  gasUsed: BigNumber;
} & ChainGasCostType<BigNumber> &
  ChainFiatCostType<number>;

// data that is stored for every transaction evaluation iteration
export type TransactionEvaluationType = {
  userSignerAddress: string;
  userIteration: number;
  userTxIteration: number;
} & TransactionEvaluationValuesType;

// type with no big numbers for better readability in json format
export type JsonReadableTransactionEvaluationType = {
  userSignerAddress: string;
  userIteration: number;
  userTxIteration: number;
  durationInMs: number;
  gasUsed: string;
} & ChainGasCostType<string> &
  ChainFiatCostType<number>;

// types for metrics that are calculated for all evaluation values
export type TransactionEvaluationMetricsType = {
  // avg / mean
  avg: string;
  median: string;
  min: string;
  max: string;
  sum: string;
};

// type where every evaluation value combines all calculated metrics
export type EvaluationMetricsType = {
  durationInMs: TransactionEvaluationMetricsType;
  gasUsed: TransactionEvaluationMetricsType;
} & ChainGasCostType<TransactionEvaluationMetricsType> &
  ChainFiatCostType<TransactionEvaluationMetricsType>;

// final generic type for creating log files json input for the different contracts in the different evaluation scripts
export type EvaluationLogJsonInputType<T> = {
  contractName: string;
  network: string;
  date: Date;
  durationInMs: number;
  contractParameters: T;
  etherUnit: EtherUnits;
  numberOfUsers: number;
  fiatPriceCurrency: CoinGeckoCurrencies;
  chainFiatPrices: ChainFiatPriceType<number>;
  chainGasPrices: {
    gasPricesInWei: ChainGasPricesType<string>;
    gasPricesInGwei: ChainGasPricesType<string>;
    gasPricesInEth: ChainGasPricesType<string>;
  };
  metrics: EvaluationMetricsType;
  data: JsonReadableTransactionEvaluationType[];
};
