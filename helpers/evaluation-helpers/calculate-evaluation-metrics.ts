import {
  TransactionEvaluationMetrics,
  TransactionEvaluationType,
  TransactionMetrics,
  TransactionEvaluationData,
} from "../../types/EvaluationTypes";
import { ContractTransaction } from "ethers";

export async function getTxEvaluationData(
  txStartTime: number,
  txEndTime: number,
  referralPaymentTx: ContractTransaction
): Promise<TransactionEvaluationData> {
  const txDurationInMs = txEndTime - txStartTime;
  const txReceipt = await referralPaymentTx.wait();
  const txGasUsed = await txReceipt.gasUsed;
  const txEffectiveGasPrice = await txReceipt.effectiveGasPrice;
  const txCost = txGasUsed.mul(txEffectiveGasPrice);

  return {
    txDurationInMs,
    txGasUsed,
    txEffectiveGasPrice,
    txCost,
  };
}

function calculateMetrics(values: number[]): TransactionMetrics {
  const sortedValues = values.slice().sort((a, b) => a - b);
  const length = values.length;
  const min = sortedValues[0];
  const max = sortedValues[length - 1];
  const median =
    length % 2 === 0
      ? (sortedValues[length / 2 - 1] + sortedValues[length / 2]) / 2
      : sortedValues[Math.floor(length / 2)];
  const avg = values.reduce((sum, value) => sum + value, 0) / length;
  const sum = sortedValues.reduce((acc, val) => acc + val);

  return {
    avg,
    median,
    min,
    max,
    sum,
  };
}

export function calculateEvaluationMetrics(
  txs: TransactionEvaluationType[]
): TransactionEvaluationMetrics {
  const gasUsedValues = txs.map((te) => te.gasUsed);
  const effectiveGasPriceValues = txs.map((te) => te.effectiveGasPrice);
  const costValues = txs.map((te) => te.cost);
  const durationInMsValues = txs.map((te) => te.durationInMs);

  return {
    gasUsed: calculateMetrics(gasUsedValues),
    effectiveGasPrice: calculateMetrics(effectiveGasPriceValues),
    cost: calculateMetrics(costValues),
    durationInMs: calculateMetrics(durationInMsValues),
  };
}
