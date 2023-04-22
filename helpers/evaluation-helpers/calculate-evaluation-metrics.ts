import {
  ChainFiatPriceType,
  ChainGasPricesType,
  EvaluationMetricsType,
  TransactionEvaluationMetricsType,
  TransactionEvaluationValuesType,
} from "../../types/EvaluationTypes";
import { BigNumber, ContractTransaction } from "ethers";
import { calculateFiatCosts } from "./calculate-fiat-costs";

// -----------------------------------------------------------------------------------------------
// helper functions to calculate evaluation metrics and values
// -----------------------------------------------------------------------------------------------

/**
 * calculate values per transaction need for the evaluation
 *
 * @param txStartTime - start time of the transaction for calculating the duration.
 * @param txEndTime - end time of the transaction for calculating the duration.
 * @param referralPaymentTx - the referral payment transaction.
 * @param chainGasPrices - the chain gas prices of the different chains used fo the evaluation as Big Numbers.
 * @param chainFiatPrices - the fiat chain prices of the different chains used for the evaluation as numbers.
 * @returns TransactionEvaluationValuesType - returns the calculated values for one transaction that are used and stored for the evaluation.
 */
export async function getTxEvaluationData(
  txStartTime: number,
  txEndTime: number,
  referralPaymentTx: ContractTransaction,
  chainGasPrices: ChainGasPricesType<BigNumber>,
  chainFiatPrices: ChainFiatPriceType<number>
): Promise<TransactionEvaluationValuesType> {
  // get tx receipt
  const txReceipt = await referralPaymentTx.wait();

  // calculate base tx evaluation values
  const durationInMs = txEndTime - txStartTime;
  const gasUsed = await txReceipt.gasUsed;
  // calculate chain specific tx gas costs
  // --> gasUsed x gas price form chain
  // UNIT: Wei
  const bscGasCost = gasUsed.mul(chainGasPrices.bsc);
  const ethereumGasCost = gasUsed.mul(chainGasPrices.mainnet);
  const polygonMainnetGasCost = gasUsed.mul(chainGasPrices["polygon-mainnet"]);
  const arbitrumMainnetGasCost = gasUsed.mul(
    chainGasPrices["arbitrum-mainnet"]
  );
  const optimismMainnetGasCost = gasUsed.mul(
    chainGasPrices["optimism-mainnet"]
  );
  const avalancheGasCost = gasUsed.mul(chainGasPrices.avalanche);
  const goerliGasCost = gasUsed.mul(chainGasPrices.goerli);
  // calculate chain specific tx fiat costs
  // --> gas price from chain x fiat price per chain
  const bscFiatCost = calculateFiatCosts(bscGasCost, chainFiatPrices.bsc);
  const ethereumFiatCost = calculateFiatCosts(
    ethereumGasCost,
    chainFiatPrices.mainnet
  );
  const polygonMainnetFiatCost = calculateFiatCosts(
    polygonMainnetGasCost,
    chainFiatPrices["polygon-mainnet"]
  );
  const arbitrumMainnetFiatCost = calculateFiatCosts(
    arbitrumMainnetGasCost,
    chainFiatPrices["arbitrum-mainnet"]
  );
  const optimismMainnetFiatCost = calculateFiatCosts(
    optimismMainnetGasCost,
    chainFiatPrices["optimism-mainnet"]
  );
  const avalancheFiatCost = calculateFiatCosts(
    avalancheGasCost,
    chainFiatPrices.avalanche
  );
  const goerliFiatCost = calculateFiatCosts(
    goerliGasCost,
    chainFiatPrices.goerli
  );
  return {
    durationInMs,
    gasUsed,
    // calculated gas costs
    bscGasCost,
    ethereumGasCost,
    polygonMainnetGasCost,
    arbitrumMainnetGasCost,
    optimismMainnetGasCost,
    avalancheGasCost,
    goerliGasCost,
    // calculated fiat costs
    bscFiatCost,
    ethereumFiatCost,
    polygonMainnetFiatCost,
    arbitrumMainnetFiatCost,
    optimismMainnetFiatCost,
    avalancheFiatCost,
    goerliFiatCost,
  };
}

// calculate the different metric types from numbers including min, max, avg, median and sum
function calculateMetrics(values: number[]): TransactionEvaluationMetricsType {
  // sort the input values in ascending order
  const sortedValues = values.slice().sort((a, b) => a - b);
  const length = values.length;
  const min = sortedValues[0].toString();
  const max = sortedValues[length - 1].toString();
  // calculate the median based on the length of the input values
  const median =
    length % 2 === 0
      ? (
          (sortedValues[length / 2 - 1] + sortedValues[length / 2]) /
          2
        ).toString()
      : sortedValues[Math.floor(length / 2)].toString();
  const avg = (
    values.reduce((sum, value) => sum + value, 0) / length
  ).toString();
  const sum = sortedValues.reduce((acc, val) => acc + val).toString();

  return {
    avg,
    median,
    min,
    max,
    sum,
  };
}

// calculate the different metric types from Big Numbers including min, max, avg, median and sum
function calculateBigNumberMetrics(
  values: BigNumber[]
): TransactionEvaluationMetricsType {
  // sort the input values in ascending order
  const sortedValues = values.slice().sort((a, b) => a.sub(b).toNumber());
  const length = values.length;
  const min = sortedValues[0].toString();
  const max = sortedValues[length - 1].toString();
  // calculate the median based on the length of the input values
  const median =
    length % 2 === 0
      ? sortedValues[length / 2 - 1]
          .add(sortedValues[length / 2])
          .div(2)
          .toString()
      : sortedValues[Math.floor(length / 2)].toString();
  // calculate the sum of the input values
  const sum = values.reduce((acc, val) => acc.add(val), BigNumber.from(0));
  const avg = sum.div(length).toString();

  return {
    avg,
    median,
    min,
    max,
    sum: sum.toString(),
  };
}

/**
 * calculate the metrics per evaluation run for all the transactions made in this evaluation rung
 *
 * @param txs - list of all recorded transactions that have been done during the evaluation run
 * @returns EvaluationMetricsType - returns the metric types per evaluation run considering all transactions.
 */
export function calculateEvaluationMetrics(
  txs: TransactionEvaluationValuesType[]
): EvaluationMetricsType {
  const gasUsedValues: BigNumber[] = txs.map((te) => te.gasUsed);
  const durationInMsValues: number[] = txs.map((te) => te.durationInMs);
  // calculated gas costs
  // if chain specific costs are not available set values to 0!
  const bscGasCostValues: BigNumber[] = txs.map((te) =>
    te.bscGasCost ? te.bscGasCost : BigNumber.from(0)
  );
  const ethereumGasCostValues: BigNumber[] = txs.map((te) =>
    te.ethereumGasCost ? te.ethereumGasCost : BigNumber.from(0)
  );
  const polygonMainnetGasCostValues: BigNumber[] = txs.map((te) =>
    te.polygonMainnetGasCost ? te.polygonMainnetGasCost : BigNumber.from(0)
  );
  const arbitrumMainnetGasCostValues: BigNumber[] = txs.map((te) =>
    te.arbitrumMainnetGasCost ? te.arbitrumMainnetGasCost : BigNumber.from(0)
  );
  const optimismMainnetGasCostValues: BigNumber[] = txs.map((te) =>
    te.optimismMainnetGasCost ? te.optimismMainnetGasCost : BigNumber.from(0)
  );
  const avalancheGasCostValues: BigNumber[] = txs.map((te) =>
    te.avalancheGasCost ? te.avalancheGasCost : BigNumber.from(0)
  );
  const goerliGasCostValues: BigNumber[] = txs.map((te) =>
    te.goerliGasCost ? te.goerliGasCost : BigNumber.from(0)
  );
  // calculated fiat costs
  const bscFiatCostValues: number[] = txs.map((te) =>
    te.bscFiatCost ? te.bscFiatCost : 0
  );
  const ethereumFiatCostValues: number[] = txs.map((te) =>
    te.ethereumFiatCost ? te.ethereumFiatCost : 0
  );
  const polygonMainnetFiatCostValues: number[] = txs.map((te) =>
    te.polygonMainnetFiatCost ? te.polygonMainnetFiatCost : 0
  );
  const arbitrumMainnetFiatCostValues: number[] = txs.map((te) =>
    te.arbitrumMainnetFiatCost ? te.arbitrumMainnetFiatCost : 0
  );
  const optimismMainnetFiatCostValues: number[] = txs.map((te) =>
    te.optimismMainnetFiatCost ? te.optimismMainnetFiatCost : 0
  );
  const avalancheFiatCostValues: number[] = txs.map((te) =>
    te.avalancheFiatCost ? te.avalancheFiatCost : 0
  );
  const goerliFiatCostValues: number[] = txs.map((te) =>
    te.goerliFiatCost ? te.goerliFiatCost : 0
  );

  return {
    gasUsed: calculateBigNumberMetrics(gasUsedValues),
    durationInMs: calculateMetrics(durationInMsValues),
    // get gas costs metrics (calculate using big numbers)
    bscGasCost: calculateBigNumberMetrics(bscGasCostValues),
    ethereumGasCost: calculateBigNumberMetrics(ethereumGasCostValues),
    polygonMainnetGasCost: calculateBigNumberMetrics(
      polygonMainnetGasCostValues
    ),
    arbitrumMainnetGasCost: calculateBigNumberMetrics(
      arbitrumMainnetGasCostValues
    ),
    optimismMainnetGasCost: calculateBigNumberMetrics(
      optimismMainnetGasCostValues
    ),
    avalancheGasCost: calculateBigNumberMetrics(avalancheGasCostValues),
    goerliGasCost: calculateBigNumberMetrics(goerliGasCostValues),
    // get fiat costs metrics (calculate using number)
    bscFiatCost: calculateMetrics(bscFiatCostValues),
    ethereumFiatCost: calculateMetrics(ethereumFiatCostValues),
    polygonMainnetFiatCost: calculateMetrics(polygonMainnetFiatCostValues),
    arbitrumMainnetFiatCost: calculateMetrics(arbitrumMainnetFiatCostValues),
    optimismMainnetFiatCost: calculateMetrics(optimismMainnetFiatCostValues),
    avalancheFiatCost: calculateMetrics(avalancheFiatCostValues),
    goerliFiatCost: calculateMetrics(goerliFiatCostValues),
  };
}
