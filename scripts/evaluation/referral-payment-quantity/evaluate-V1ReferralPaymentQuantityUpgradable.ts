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
import { calculateEvaluationMetrics } from "../../../helpers/calculate-evaluation-metrics";
import { BigNumber } from "ethers";
import { PercentageType } from "../../../types/PercentageTypes";
import { EvaluationPaymentQuantityContractParams } from "../../../types/EvaluationContractParameterTypes";
import { V1ReferralPaymentQuantityUpgradable } from "../../../typechain-types";

// -----------------------------------------------------
// Evaluation script for V1ReferralPaymentQuantityUpgradable Contract
// -----------------------------------------------------

const CONTRACT = "V1ReferralPaymentQuantityUpgradable";

const LOG_DIRECTORY = "evaluations/";

const LOG_FILE_NAME = `${LOG_DIRECTORY}${CONTRACT}-contract-evaluation`;

const ETHER_UNIT = EtherUnits.Ether;

// CONTRACT PARAMETERS
const REWARD_PERCENTAGE: PercentageType = 30;
const QUANTITY_THRESHOLD: BigNumber = BigNumber.from(2);

// TX / REFERRAL PROCESS PARAMS
const PAYMENT_AMOUNT = etherUnitConverter[ETHER_UNIT](15);

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
  const proxyContract: V1ReferralPaymentQuantityUpgradable =
    (await upgrades.deployProxy(referralContract, [
      receiver.address,
      REWARD_PERCENTAGE,
      QUANTITY_THRESHOLD,
    ])) as V1ReferralPaymentQuantityUpgradable;
  await proxyContract.deployed();

  // evaluate referral transactions
  // -----------------------------------------------------------------------------------------------

  // get current network details for logs
  const networkInfo = await getNetworkInfo(deployer);
  const networkName = resolveNetworkIds(networkInfo.name, networkInfo.id);
  const networkId = networkInfo.id;

  console.log(
    `Executing referral transactions for ${numberOfUsers} users on the ${networkName} network...\n`
  );

  const evaluationResultData: TransactionEvaluationType[] = [];

  console.log(
    `Evaluating ${CONTRACT} referral transactions on the ${networkName} network...\n`
  );

  // number of txs per user to complete the referral process
  const txsPerUser = QUANTITY_THRESHOLD.toNumber() + 1;

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

      // calculate tx evaluation metrics
      const txDurationInMs = txEndTime - txStartTime;
      const txReceipt = await referralPaymentTx.wait();
      const txGasUsed = await txReceipt.gasUsed;
      const txEffectiveGasPrice = await txReceipt.effectiveGasPrice;
      const txCost = txGasUsed.mul(txEffectiveGasPrice);

      // log values
      console.log(" Iteration", i, "");
      console.log(" User Tx Number", j, "");
      console.log(" Referral Process Completed", referralCompleted, "");
      console.log(` Gas Used: ${txGasUsed}`);
      console.log(` Effective Gas Price: ${txGasUsed}`);
      console.log(` Tx Cost: ${txCost} (gas used * gas price)`);
      console.log(` Duration in Ms: ${txDurationInMs}`);
      console.log("\n");

      // create result data
      const resultData: TransactionEvaluationType = {
        iteration: i,
        signerAddress: refereeUser.address,
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
  const logInput: EvaluationLogJsonInputType<EvaluationPaymentQuantityContractParams> =
    {
      contractName: CONTRACT,
      network: `${networkId}-${networkName}`,
      date: new Date(),
      durationInMs: evaluationDurationInMs,
      etherUnit: ETHER_UNIT,
      contractParameters: {
        referralPercentage: REWARD_PERCENTAGE,
        quantityThreshold: QUANTITY_THRESHOLD,
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
    `Something went wrong with the ${CONTRACT} deployment:\n`,
    error
  );
  process.exitCode = 1;
});
