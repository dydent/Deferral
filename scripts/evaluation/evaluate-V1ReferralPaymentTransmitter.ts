import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { etherUnitConverter } from "../../helpers/unit-converters";
import { EtherUnits } from "../../types/ValidUnitTypes";
import { resolveNetworkIds } from "../../helpers/resolve-network-ids";
import { getNetworkInfo } from "../../helpers/get-network-info";
import { Signer } from "ethers";
import { generateRandomSigners } from "../../helpers/generate-random-signers";
import { getTransactionCosts } from "../../helpers/get-transaction-costs";

// -----------------------------------------------------
// Evaluation script for V1ReferralPaymentTransmitter Contract
// -----------------------------------------------------

const CONTRACT = "V1ReferralPaymentTransmitter";

const LOG_FILE_NAME = `${CONTRACT}-contract-deployments`;

const ETHER_UNIT = EtherUnits.Ether;

// CONTRACT PARAMETERS
const PAYMENT_AMOUNT = etherUnitConverter[ETHER_UNIT](2);
const REFERRAL_REWARD = etherUnitConverter[ETHER_UNIT](0.5);

// EVALUATION PARAMETERS
const ITERATIONS = 100;

async function main() {
  // measure time for logs
  const startTime = performance.now();

  // Account Array Order from env file matters --> [DEPLOYER/OWNER, RECEIVER, REFERRER, REFEREE]
  const [deployer, receiver] = await ethers.getSigners();

  // get current network details for logs
  const networkInfo = await getNetworkInfo(deployer);
  const networkName = resolveNetworkIds(networkInfo.name, networkInfo.id);
  const networkId = networkInfo.id;

  console.log(
    `Evaluating ${CONTRACT} contract on the ${networkName} network...\n`
  );

  // deploy contract --> deployer account signs this transaction
  const referralContract = await ethers.getContractFactory(CONTRACT);
  const deployedReferralContract = await referralContract.deploy(
    receiver.address,
    PAYMENT_AMOUNT,
    REFERRAL_REWARD
  );
  await deployedReferralContract.deployed();

  // generate signers
  const referralParticipants: Signer[] = generateRandomSigners(ITERATIONS);

  // execute transactions for signers
  for (let i = 0; i < ITERATIONS; i++) {
    const user = referralParticipants[i];
    const userAddress = await user.getAddress();

    const referralPaymentTx = await deployedReferralContract
      .connect(user)
      .forwardReferralPayment(userAddress, {
        value: PAYMENT_AMOUNT,
      });

    const referralPaymentTxCost = getTransactionCosts(referralPaymentTx);

    // const user = referralParticipants[i];
    // console.log("user.address", user.address, "");
    console.log("i", i, "");
  }

  // // calculate deployment transaction costs
  // const deploymentTxReceipt =
  //   await deployedReferralContract.deployTransaction.wait();
  // const txGasUsed = await deploymentTxReceipt.gasUsed;
  // const txEffectiveGasPrice = await deploymentTxReceipt.effectiveGasPrice;
  // const txCost = txGasUsed.mul(txEffectiveGasPrice);
  //
  // // get deployer / signer address that deploys the contract
  // const adminAddress = await deployedReferralContract.signer.getAddress();
  //
  // // wait for contract to be deployed
  // const deployedProxyContract = await deployedReferralContract.deployed();

  // time measuring
  const endTime = performance.now();

  const deploymentDuration = endTime - startTime;

  // // log message
  // console.log(
  //   `${adminAddress} deployed ${CONTRACT} contract to ${deployedProxyContract.address}`
  // );
  // console.log(` Gas Used: ${txGasUsed}`);
  // console.log(` Tx Cost: ${txCost} (gas used * gas price)`);
  // console.log(` Duration: ${deploymentDuration} ms`);
  // console.log("\n");
  //
  // // create (write & store) log files of deployments for overview
  // const logInput: LogJsonInputType = {
  //   date: new Date(),
  //   contract: CONTRACT,
  //   contractAddress: deployedProxyContract.address,
  //   signer: adminAddress,
  //   gasUsed: txGasUsed.toString(),
  //   effectiveGasPrice: txEffectiveGasPrice.toString(),
  //   cost: txCost.toString(),
  //   durationInMs: deploymentDuration,
  // };
  // writeLogFile({
  //   filePath: LOG_FILE_NAME,
  //   jsonInput: logInput,
  //   chainID: networkId,
  //   chainName: networkName,
  // });
}

// catch deployment errors
main().catch((error) => {
  console.error(
    `Something went wrong with the ${CONTRACT} deployment:\n`,
    error
  );
  process.exitCode = 1;
});
