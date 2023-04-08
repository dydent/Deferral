import { ethers, upgrades } from "hardhat";
import { etherUnitConverter } from "../../../helpers/unit-converters";
import { getNetworkInfo } from "../../../helpers/get-network-info";
import { writeLogFile } from "../../../helpers/write-files";
import { resolveNetworkIds } from "../../../helpers/resolve-network-ids";
import { EtherUnits } from "../../../types/ValidUnitTypes";
import { DeploymentLogJsonInputType } from "../../../types/DeploymentTypes";

// -----------------------------------------------------
// deployment script for V2ReferralPaymentTransmitterUpgradable Contract
// -----------------------------------------------------

const CONTRACT = "V2ReferralPaymentTransmitterUpgradable";

const LOG_DIRECTORY = "deployments/referral-payment-transmitter/";

const LOG_FILE_NAME = `${CONTRACT}-contract-deployments`;

const ETHER_UNIT = EtherUnits.Ether;

// CONTRACT PARAMETERS
const PAYMENT_AMOUNT = etherUnitConverter[ETHER_UNIT](2);
const REFERRAL_REWARD = etherUnitConverter[ETHER_UNIT](0.5);

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
  console.log(`Deploying ${CONTRACT} contract to ${networkName} network...\n`);

  // deploy upgradable-contract
  const initialReferralContract = await ethers.getContractFactory(CONTRACT);
  const proxyContract = await upgrades.deployProxy(initialReferralContract, [
    receiver.address,
    PAYMENT_AMOUNT,
    REFERRAL_REWARD,
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
    `${adminAddress} deployed ${CONTRACT} contract to ${deployedProxyContract.address}`
  );
  console.log(` Gas Used: ${txGasUsed}`);
  console.log(` Tx Cost: ${txCost} (gas used * gas price)`);
  console.log(` Duration: ${deploymentDuration} ms`);
  console.log("\n");

  // create (write & store) log files of deployments for overview
  const logInput: DeploymentLogJsonInputType = {
    date: new Date(),
    contract: CONTRACT,
    contractAddress: deployedProxyContract.address,
    signer: adminAddress,
    gasUsed: txGasUsed.toString(),
    effectiveGasPrice: txEffectiveGasPrice.toString(),
    cost: txCost.toString(),
    durationInMs: deploymentDuration,
  };
  writeLogFile<DeploymentLogJsonInputType>({
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
