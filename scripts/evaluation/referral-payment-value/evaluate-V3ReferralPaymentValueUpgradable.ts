import { ethers, upgrades } from "hardhat";
import { etherUnitConverter } from "../../../helpers/unit-converters";
import { EtherUnits } from "../../../types/ValidUnitTypes";
import { resolveNetworkIds } from "../../../helpers/resolve-network-ids";
import { getNetworkInfo } from "../../../helpers/get-network-info";
import { writeLogFile } from "../../../helpers/write-files";
import { HARDHAT_ACCOUNTS_COUNT } from "../../../hardhat.config";
import {
  EvaluationLogJsonInputType,
  TransactionEvaluationType,
} from "../../../types/EvaluationTypes";
import {
  calculateEvaluationMetrics,
  getTxEvaluationData,
} from "../../../helpers/evaluation-helpers/calculate-evaluation-metrics";
import { BigNumber } from "ethers";
import { PercentageType } from "../../../types/PercentageTypes";
import { V3EvaluationPaymentValueContractParams } from "../../../types/EvaluationContractParameterTypes";
import { V3ReferralPaymentValueUpgradable } from "../../../typechain-types";
import { logEvaluationTx } from "../../../helpers/evaluation-helpers/evaluation-tx-logs";

// -----------------------------------------------------
// Evaluation script for V3ReferralPaymentValueUpgradable Contract
// -----------------------------------------------------

const CONTRACT = "V3ReferralPaymentValueUpgradable";

type CONTRACT_TYPE = V3ReferralPaymentValueUpgradable;

type CONTRACT_PARAMS_TYPE = V3EvaluationPaymentValueContractParams;

const LOG_DIRECTORY = "evaluations/referral-payment-value/";

const LOG_FILE_NAME = `${LOG_DIRECTORY}${CONTRACT}-contract-evaluation`;

const ETHER_UNIT = EtherUnits.Ether;

// CONTRACT PARAMETERS
const REWARD_PERCENTAGE: PercentageType = 30;
const REFEREE_REWARD_PERCENTAGE: PercentageType = 30;
const VALUE_THRESHOLD: BigNumber = etherUnitConverter[ETHER_UNIT](15);

// TX / REFERRAL PROCESS PARAMS
const PAYMENT_AMOUNT = etherUnitConverter[ETHER_UNIT](5);

async function main() {
  const evaluationStartTime = performance.now();

  console.log(`Evaluating ${CONTRACT} contract ...\n`);
  console.log(`Initializing ${HARDHAT_ACCOUNTS_COUNT} Hardhat accounts ...\n`);

  // get all accounts/signers
  const allSigners = await ethers.getSigners();

  // get deployer and receiver accounts
  const [deployer, receiver] = allSigners;
  // get all other accounts --> users/participants
  const users = allSigners.slice(2);
  // get number of users
  const numberOfUsers = users.length;

  // deploy contract with receiver address --> deployer account signs this transaction
  // -----------------------------------------------------------------------------------------------
  const referralContract = await ethers.getContractFactory(CONTRACT);
  const proxyContract: CONTRACT_TYPE = (await upgrades.deployProxy(
    referralContract,
    [
      receiver.address,
      REWARD_PERCENTAGE,
      REFEREE_REWARD_PERCENTAGE,
      VALUE_THRESHOLD,
    ]
  )) as CONTRACT_TYPE;
  await proxyContract.deployed();

  // evaluate referral transactions
  // -----------------------------------------------------------------------------------------------

  // get current network details for logs
  const networkInfo = await getNetworkInfo(deployer);
  const networkName = resolveNetworkIds(networkInfo.name, networkInfo.id);
  const networkId = networkInfo.id;

  const evaluationResultData: TransactionEvaluationType[] = [];

  // number of txs per user to complete the referral process
  const txsPerUser = VALUE_THRESHOLD.div(PAYMENT_AMOUNT).toNumber() + 1;

  console.log(
    `${CONTRACT}: Executing ${txsPerUser} referral transactions per users for ${numberOfUsers} users on the ${networkName} network...\n`
  );

  // -1 since we need a referrer for every referee
  const loopIterations = numberOfUsers - 1;

  // execute transactions for signers
  for (let i = 0; i < loopIterations; i++) {
    const refereeUser = users[i];

    // referrer user (addressed used as referrer address)
    const referrerUser = users[i + 1];
    // execute required amount of txs per user to complete referral
    for (let j = 0; j < txsPerUser; j++) {
      // referee user (executes the txs)

      const txStartTime = performance.now();

      const referralPaymentTx = await proxyContract
        .connect(refereeUser)
        .registerReferralPayment(referrerUser.address, {
          value: PAYMENT_AMOUNT,
        });
      const txEndTime = performance.now();

      // get referral process status
      const mapping = await proxyContract.refereeProcessMapping(
        refereeUser.address
      );
      const referralCompleted: boolean = mapping.referralProcessCompleted;

      // calculate tx evaluation metrics data
      const { txDurationInMs, txCost, txEffectiveGasPrice, txGasUsed } =
        await getTxEvaluationData(txStartTime, txEndTime, referralPaymentTx);

      // log values
      logEvaluationTx({
        user: refereeUser,
        userIteration: i,
        userTxIteration: j,
        referralCompleted,
        txGasUsed,
        txEffectiveGasPrice,
        txCost,
        txDurationInMs,
      });

      // create result data
      const resultData: TransactionEvaluationType = {
        userSignerAddress: refereeUser.address,
        userIteration: i,
        userTxIteration: j,
        gasUsed: txGasUsed.toNumber(),
        effectiveGasPrice: txEffectiveGasPrice.toNumber(),
        cost: txCost.toNumber(),
        durationInMs: txDurationInMs,
      };
      // append result data to evaluation data
      evaluationResultData.push(resultData);
    }
  }

  console.log(`$ Calculating transaction metrics for evaluation...`);
  const evaluationMetrics = calculateEvaluationMetrics(evaluationResultData);

  // time measuring
  const evaluationEndTime = performance.now();
  const evaluationDurationInMs = evaluationEndTime - evaluationStartTime;
  // log message
  console.log(
    `$ Evaluation of ${CONTRACT} contract finished in ${evaluationDurationInMs} ms`
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
      refereeRewardPercentage: REFEREE_REWARD_PERCENTAGE.toString(),
      valueThreshold: VALUE_THRESHOLD.toString(),
    },
    numberOfUsers: numberOfUsers,
    metrics: evaluationMetrics,
    data: evaluationResultData,
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
