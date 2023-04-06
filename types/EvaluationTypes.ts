import { BigNumber } from "ethers";
import { EtherUnits } from "./ValidUnitTypes";

export type TransactionMetrics = {
  // avg / mean
  avg: number;
  median: number;
  min: number;
  max: number;
  sum: number;
};

export type BNTransactionMetrics = {
  // avg / mean
  avg: BigNumber;
  median: BigNumber;
  min: BigNumber;
  max: BigNumber;
  sum: BigNumber;
};

export type TransactionEvaluationMetrics = {
  gasUsed: TransactionMetrics;
  effectiveGasPrice: TransactionMetrics;
  cost: TransactionMetrics;
  durationInMs: TransactionMetrics;
};

export type TransactionEvaluationType = {
  iteration: number;
  signerAddress: string;
  gasUsed: number;
  effectiveGasPrice: number;
  cost: number;
  durationInMs: number;
};

export type EvaluationLogJsonInputType<T> = {
  contractName: string;
  network: string;
  date: Date;
  durationInMs: number;
  etherUnit: EtherUnits;
  contractParameters: T;
  numberOfUsers: number;
  metrics: TransactionEvaluationMetrics;
  data: TransactionEvaluationType[];
};
