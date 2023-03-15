import { ethers, upgrades } from "hardhat";
import { getNetworkInfo } from "../helpers/get-network-info";
import { LogJsonInputType, writeLogFile } from "../helpers/write-files";
import { resolveNetworkIds } from "../helpers/resolve-network-ids";

// ------------------------------------------------------------------
// deployment script for upgradable referral payment proxy contracts
// ------------------------------------------------------------------

const LOG_FILE_NAME = "payment-quantity-contract-deployments.json";

// const INITIAL_CONTRACT = "UpgradableV1ReferralPaymentProxy";
const CONTRACT = "V1ReferralPaymentValueUpgradable";

// percentage of payments that will be distributed as referral rewards after successfull referral process
const REFERRAL_PERCENTAGE = 50;
const REQUIRED__VALUE_OF_PAYMENTS = 3;

async function main() {
  // measure time for logs
  const startTime = performance.now();

  // Account Array Order from env file matters --> [DEPLOYER/OWNER, RECEIVER, REFERRER, REFEREE]
  const [deployer, receiver] = await ethers.getSigners();

  // get current network details for logs
  const networkInfo = await getNetworkInfo(deployer);
  // set correct network name if it is hardhat or ganache local network
  const networkName = resolveNetworkIds(networkInfo.name, networkInfo.id);
  const networkId = networkInfo.id;
  // log message

  console.log(
    `Deploying payment value referral contracts to ${networkName} network...\n`
  );

  // deploy upgradable-contracts contract --> has to be an upgradable-contracts contract
  const initialReferralContract = await ethers.getContractFactory(CONTRACT);
  const proxyContract = await upgrades.deployProxy(initialReferralContract, [
    receiver.address,
    REFERRAL_PERCENTAGE,
    REQUIRED__VALUE_OF_PAYMENTS,
  ]);

  // calculate deployment transaction costs
  const deploymentTxReceipt = await proxyContract.deployTransaction.wait();
  const txGasUsed = await deploymentTxReceipt.gasUsed;
  const txEffectiveGasPrice = await deploymentTxReceipt.effectiveGasPrice;
  const txCost = txGasUsed.mul(txEffectiveGasPrice);

  // get deployer / signer address that deploys the contract
  const adminAddress = await proxyContract.signer.getAddress();

  // wait for contract to be deployed
  const deployedProxyContract = await proxyContract.deployed();

  // time measuring
  const endTime = performance.now();

  const deploymentDuration = endTime - startTime;

  // log message
  console.log(
    ` ${adminAddress} deployed ${CONTRACT} contract to ${deployedProxyContract.address}`
  );
  console.log(` Gas Used: ${txGasUsed}`);
  console.log(` Tx Cost: ${txCost} (gas used * gas price)`);
  console.log(` Duration: ${deploymentDuration} ms`);
  console.log("\n");

  // create (write & store) log files of deployments for overview
  const logInput: LogJsonInputType = {
    date: new Date(),
    contract: CONTRACT,
    contractAddress: deployedProxyContract.address,
    signer: adminAddress,
    gasUsed: txGasUsed.toString(),
    effectiveGasPrice: txEffectiveGasPrice.toString(),
    cost: txCost.toString(),
    durationInMs: deploymentDuration,
  };
  writeLogFile({
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