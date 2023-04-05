import { ethers, upgrades } from "hardhat";
import { etherUnitConverter } from "../../../helpers/unit-converters";
import { getNetworkInfo } from "../../../helpers/get-network-info";
import { LogJsonInputType, writeLogFile } from "../../../helpers/write-files";
import { resolveNetworkIds } from "../../../helpers/resolve-network-ids";
import { EtherUnits } from "../../../types/ValidUnitTypes";
import { BigNumber } from "ethers";
import { PercentageType } from "../../../types/PercentageTypes";

// -----------------------------------------------------
// deployment script for V2ReferralMultilevelRewardsUpgradable Contract
// -----------------------------------------------------

const CONTRACT = "V2ReferralMultilevelRewardsUpgradable";

const LOG_FILE_NAME = `${CONTRACT}-contract-deployments`;

const ETHER_UNIT = EtherUnits.Ether;

// CONTRACT PARAMETERS
const REWARD_PERCENTAGE: PercentageType = 20;
const REFEREE_REWARD_PERCENTAGE: PercentageType = 10;
const PAYMENTS_QUANTITY_THRESHOLD: BigNumber = BigNumber.from(3);
const PAYMENTS_VALUE_THRESHOLD: BigNumber = etherUnitConverter[ETHER_UNIT](10);
const MAX_REWARDS_LEVEL: BigNumber = BigNumber.from(3);

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
    REWARD_PERCENTAGE,
    REFEREE_REWARD_PERCENTAGE,
    PAYMENTS_QUANTITY_THRESHOLD,
    PAYMENTS_VALUE_THRESHOLD,
    MAX_REWARDS_LEVEL,
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
