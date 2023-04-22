import { ethers, upgrades } from "hardhat";
import { etherUnitConverter } from "../../../helpers/unit-converters";
import { EtherUnits } from "../../../types/ValidUnitTypes";
import { resolveNetworkIds } from "../../../helpers/resolve-network-ids";
import { getNetworkInfo } from "../../../helpers/get-network-info";
import { writeLogFile } from "../../../helpers/write-files";
import { HARDHAT_ACCOUNTS_COUNT } from "../../../hardhat.config";
import {
  EvaluationLogJsonInputType,
  EvaluationMetricsType,
  JsonReadableTransactionEvaluationType,
  TransactionEvaluationType,
  TransactionEvaluationValuesType,
} from "../../../types/EvaluationTypes";
import {
  calculateEvaluationMetrics,
  getTxEvaluationData,
} from "../../../helpers/evaluation-helpers/calculate-evaluation-metrics";
import { BigNumber } from "ethers";
import { PercentageType } from "../../../types/PercentageTypes";
import { EvaluationPaymentMultilevelRewardContractParams } from "../../../types/EvaluationContractParameterTypes";
import { V1ReferralMultilevelRewardsUpgradable } from "../../../typechain-types";
import { logEvaluationTx } from "../../../helpers/evaluation-helpers/evaluation-tx-logs";
import { getFiatChainPrices } from "../../../helpers/evaluation-helpers/get-fiat-chain-prices";
import { EVALUATION_CHAIN_DATA } from "../../../helpers/constants/evaluation-chains";
import { getGasChainPrices } from "../../../helpers/evaluation-helpers/get-gas-chain-prices";
import { CoinGeckoCurrencies } from "../../../types/CoinGeckoTypes";

// ---------------------------------------------------------------------------
// Evaluation script for V1ReferralMultilevelRewardsUpgradable Contract
// ---------------------------------------------------------------------------

const CONTRACT = "V1ReferralMultilevelRewardsUpgradable";

type CONTRACT_TYPE = V1ReferralMultilevelRewardsUpgradable;

type CONTRACT_PARAMS_TYPE = EvaluationPaymentMultilevelRewardContractParams;

const LOG_DIRECTORY = "evaluations/referral-payment-multilevel-rewards/";

const LOG_FILE_NAME = `${CONTRACT}-contract-evaluation`;

// ETHER UNIT THAT IS USED TO CONVERT VALUES
// --> changing the ether unit can have impacts on the precision of the results
const ETHER_UNIT = EtherUnits.Ether;

// CONTRACT PARAMETERS
const REWARD_PERCENTAGE: PercentageType = 30;
const QUANTITY_THRESHOLD: BigNumber = BigNumber.from(2);
const VALUE_THRESHOLD: BigNumber = etherUnitConverter[ETHER_UNIT](10);

// TX / REFERRAL PROCESS PARAMS
const PAYMENT_AMOUNT = VALUE_THRESHOLD.div(QUANTITY_THRESHOLD);

// CURRENCY FOR FIAT CHAIN PRICES
const FIAT_CURRENCY = CoinGeckoCurrencies.USD;

async function main() {
  console.log(`Evaluating ${CONTRACT} contract ...\n`);

  // fetch fiat prices for evaluation chains
  console.log(
    `... fetching fiat ${FIAT_CURRENCY} prices for evaluation chains ...\n`
  );
  const { fiatPrices } = await getFiatChainPrices(EVALUATION_CHAIN_DATA);

  // fetch gas prices for evaluation chains
  console.log(`... fetching gas prices for evaluation chains ...\n`);
  const { bnGasPricesInWei, gasPricesInWei, gasPricesInGwei, gasPricesInEth } =
    await getGasChainPrices(EVALUATION_CHAIN_DATA);

  // initializing hardhat accounts for evaluation process
  console.log(
    `... initializing ${HARDHAT_ACCOUNTS_COUNT} Hardhat accounts ...\n`
  );

  console.log(`... starting evaluation process ...\n`);
  const evaluationStartTime = performance.now();

  // get all accounts/signers
  const allSigners = await ethers.getSigners();

  // get deployer and receiver accounts and root referrer user
  const [deployer, receiver, rootReferrer] = allSigners;
  // get all other accounts --> users/participants
  const users = allSigners.slice(3);
  // get number of users
  const numberOfUsers = users.length;

  // deploy contract with receiver address --> deployer account signs this transaction
  // -----------------------------------------------------------------------------------------------
  const referralContract = await ethers.getContractFactory(CONTRACT);
  const proxyContract: CONTRACT_TYPE = (await upgrades.deployProxy(
    referralContract,
    [receiver.address, REWARD_PERCENTAGE, QUANTITY_THRESHOLD, VALUE_THRESHOLD]
  )) as CONTRACT_TYPE;
  await proxyContract.deployed();

  // evaluate referral transactions
  // -----------------------------------------------------------------------------------------------

  // get current network details for logs
  const networkInfo = await getNetworkInfo(deployer);
  const networkName = resolveNetworkIds(networkInfo.name, networkInfo.id);
  const networkId = networkInfo.id;

  const evaluationResultData: TransactionEvaluationType[] = [];
  // for json log files
  const readableEvaluationResultData: JsonReadableTransactionEvaluationType[] =
    [];

  // number of txs per user to complete the referral process
  // make sure it completes the process based on the contract params specified above
  const txsPerUser = VALUE_THRESHOLD.div(PAYMENT_AMOUNT).toNumber() + 1;

  console.log(
    `${CONTRACT}: Executing ${txsPerUser} referral transactions per users for ${numberOfUsers} users on the ${networkName} network...\n`
  );

  // -2 since we need a referrer for every referee and a root referrer at the beginning
  const loopIterations = numberOfUsers - 2;

  // register root referrer
  await proxyContract
    .connect(rootReferrer)
    ["registerReferralPayment()"]({ value: PAYMENT_AMOUNT });

  // execute transactions for signers
  for (let i = 0; i < loopIterations; i++) {
    const refereeUser = users[i];

    // referrer user (addressed used as referrer address)
    const referrerUser = i === 0 ? rootReferrer : users[i - 1];
    // execute required amount of txs per user to complete referral
    for (let j = 0; j < txsPerUser; j++) {
      // referee user (executes the txs)

      const txStartTime = performance.now();

      const referralPaymentTx = await proxyContract
        .connect(refereeUser)
        ["registerReferralPayment(address)"](referrerUser.address, {
          value: PAYMENT_AMOUNT,
        });

      const txEndTime = performance.now();

      // get referral process status
      const mapping = await proxyContract.refereeProcessMapping(
        refereeUser.address
      );
      const referralCompleted: boolean = mapping.referralProcessCompleted;

      // calculate tx evaluation data including gas costs and fiat prices
      const txEvaluationData: TransactionEvaluationValuesType =
        await getTxEvaluationData(
          txStartTime,
          txEndTime,
          referralPaymentTx,
          bnGasPricesInWei,
          fiatPrices
        );

      // log values
      logEvaluationTx({
        fiatCurrency: FIAT_CURRENCY,
        user: refereeUser,
        referralCompleted,
        userSignerAddress: refereeUser.address,
        userIteration: i,
        userTxIteration: j,
        ...txEvaluationData,
      });

      // create result data
      const resultData: TransactionEvaluationType = {
        userSignerAddress: refereeUser.address,
        userIteration: i,
        userTxIteration: j,
        ...txEvaluationData,
      };
      // append result data to evaluation data
      evaluationResultData.push(resultData);

      //  create and append result data in json readable format
      const readableResultData: JsonReadableTransactionEvaluationType = {
        userSignerAddress: refereeUser.address,
        userIteration: i,
        userTxIteration: j,
        ...txEvaluationData,
        // include big number values as strings for readability
        gasUsed: txEvaluationData.gasUsed?.toString(),
        bscGasCost: txEvaluationData.bscGasCost?.toString(),
        ethereumGasCost: txEvaluationData.ethereumGasCost?.toString(),
        polygonMainnetGasCost:
          txEvaluationData.polygonMainnetGasCost?.toString(),
        arbitrumMainnetGasCost:
          txEvaluationData.arbitrumMainnetGasCost?.toString(),
        optimismMainnetGasCost:
          txEvaluationData.optimismMainnetGasCost?.toString(),
        avalancheGasCost: txEvaluationData.avalancheGasCost?.toString(),
        goerliGasCost: txEvaluationData.goerliGasCost?.toString(),
      };
      // append readable result data to readable evaluation data
      readableEvaluationResultData.push(readableResultData);
    }
  }

  console.log(`\nCalculating evaluation metrics ...`);
  const evaluationMetrics: EvaluationMetricsType =
    calculateEvaluationMetrics(evaluationResultData);

  // time measuring
  const evaluationEndTime = performance.now();
  const evaluationDurationInMs = evaluationEndTime - evaluationStartTime;
  // log message
  console.log(
    `\nEvaluation of ${CONTRACT} contract finished in ${evaluationDurationInMs} ms`
  );

  // create (write & store) log files of deployments for overview
  const logInput: EvaluationLogJsonInputType<CONTRACT_PARAMS_TYPE> = {
    contractName: CONTRACT,
    network: `${networkId}-${networkName}`,
    date: new Date(),
    durationInMs: evaluationDurationInMs,
    etherUnit: ETHER_UNIT,
    contractParameters: {
      referralPercentage: REWARD_PERCENTAGE.toString(),
      quantityThreshold: QUANTITY_THRESHOLD.toString(),
      valueThreshold: VALUE_THRESHOLD.toString(),
    },
    fiatPriceCurrency: FIAT_CURRENCY,
    chainFiatPrices: fiatPrices,
    chainGasPrices: {
      gasPricesInWei,
      gasPricesInGwei,
      gasPricesInEth,
    },
    numberOfUsers: numberOfUsers,
    metrics: evaluationMetrics,
    data: readableEvaluationResultData,
  };
  writeLogFile({
    directory: LOG_DIRECTORY,
    filePath: LOG_FILE_NAME,
    jsonInput: logInput,
    chainID: networkId,
    chainName: networkName,
  });
}

// catch deployment errors
main().catch((error) => {
  console.error(
    `Something went wrong with the ${CONTRACT} evaluation:\n`,
    error
  );
  process.exitCode = 1;
});
