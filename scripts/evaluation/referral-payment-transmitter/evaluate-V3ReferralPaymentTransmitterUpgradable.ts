import { ethers, upgrades } from "hardhat";
import { etherUnitConverter } from "../../../helpers/unit-converters";
import { EtherUnits } from "../../../types/ValidUnitTypes";
import { resolveNetworkIds } from "../../../helpers/resolve-network-ids";
import { getNetworkInfo } from "../../../helpers/get-network-info";
import { writeLogFile } from "../../../helpers/write-files";
import { HARDHAT_ACCOUNTS_COUNT } from "../../../hardhat.config";
import {
  EvaluationLogJsonInputType,
  TransactionEvaluationMetrics,
  TransactionEvaluationType,
} from "../../../types/EvaluationTypes";
import {
  calculateEvaluationMetrics,
  getTxEvaluationData,
} from "../../../helpers/evaluation-helpers/calculate-evaluation-metrics";
import { EvaluationPaymentTransmitterContractParams } from "../../../types/EvaluationContractParameterTypes";
import { V3ReferralPaymentTransmitterUpgradable } from "../../../typechain-types";
import { logEvaluationTx } from "../../../helpers/evaluation-helpers/evaluation-tx-logs";

// -----------------------------------------------------
// Evaluation script for V3ReferralPaymentValueUpgradable Contract
// -----------------------------------------------------

const CONTRACT = "V3ReferralPaymentTransmitterUpgradable";

type CONTRACT_TYPE = V3ReferralPaymentTransmitterUpgradable;

type CONTRACT_PARAMS_TYPE = EvaluationPaymentTransmitterContractParams;

const LOG_DIRECTORY = "evaluations/referral-payment-transmitter/";

const LOG_FILE_NAME = `${CONTRACT}-contract-evaluation`;

const ETHER_UNIT = EtherUnits.Ether;

// CONTRACT PARAMETERS
const PAYMENT_AMOUNT = etherUnitConverter[ETHER_UNIT](15);
const REFERRAL_REWARD = etherUnitConverter[ETHER_UNIT](5);

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
    [receiver.address, PAYMENT_AMOUNT, REFERRAL_REWARD]
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
  const txsPerUser = 1;

  console.log(
    `${CONTRACT}: Executing ${txsPerUser} referral transactions per user for ${numberOfUsers} users on the ${networkName} network...\n`
  );

  // -1 since we need a referrer for every referee
  const loopIterations = numberOfUsers - 1;
  // execute transactions for signers
  for (let i = 0; i < loopIterations; i++) {
    // referee user (executes the txs)
    const refereeUser = users[i];
    const refereeUserBalance = await refereeUser.getBalance();
    console.log("refereeUserBalance", refereeUserBalance, "");

    // referrer user (addressed used as referrer address)
    const referrerUser = users[i + 1];

    const txStartTime = performance.now();

    const referralPaymentTx = await proxyContract
      .connect(refereeUser)
      .forwardReferralPayment(referrerUser.address, {
        value: PAYMENT_AMOUNT,
      });
    const txEndTime = performance.now();

    // calculate tx evaluation metrics data
    const { txDurationInMs, txCost, txEffectiveGasPrice, txGasUsed } =
      await getTxEvaluationData(txStartTime, txEndTime, referralPaymentTx);

    // log values
    logEvaluationTx({
      user: refereeUser,
      userIteration: i,
      userTxIteration: txsPerUser,
      txGasUsed,
      txEffectiveGasPrice,
      txCost,
      txDurationInMs,
    });

    // create result data
    const resultData: TransactionEvaluationType = {
      userSignerAddress: refereeUser.address,
      userIteration: i,
      userTxIteration: txsPerUser,
      gasUsed: txGasUsed.toNumber(),
      effectiveGasPrice: txEffectiveGasPrice.toNumber(),
      cost: txCost.toNumber(),
      durationInMs: txDurationInMs,
    };
    // append result data to evaluation data
    evaluationResultData.push(resultData);
  }

  console.log(`$ Calculating transaction metrics for evaluation...`);
  const evaluationMetrics: TransactionEvaluationMetrics =
    calculateEvaluationMetrics(evaluationResultData);

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
      paymentAmount: PAYMENT_AMOUNT.toString(),
      referralReward: REFERRAL_REWARD.toString(),
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
