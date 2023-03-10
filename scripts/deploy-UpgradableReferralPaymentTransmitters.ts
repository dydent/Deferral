import { ethers, upgrades } from "hardhat";
import { ethConverter } from "../helpers/converters";
import { getNetworkInfo } from "../helpers/get-network-info";
import { writeLogFile } from "../helpers/write-files";
import { resolveNetworkIds } from "../helpers/resolve-network-ids";

// ------------------------------------------------------------------
// deployment script for upgradable referral payment proxy contracts
// ------------------------------------------------------------------

// const INITIAL_CONTRACT = "UpgradableV1ReferralPaymentProxy";
const CONTRACT = "UpgradableV2ReferralPaymentProxy";

const PAYMENT_AMOUNT = ethConverter(10);
const REFERRAL_REWARD = ethConverter(1);

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
    `Deploying upgradable referral contracts to ${networkName} network...\n`
  );

  // deploy upgradable-contracts contract --> has to be an upgradable-contracts contract
  const initialReferralContract = await ethers.getContractFactory(CONTRACT);
  const proxyContract = await upgrades.deployProxy(initialReferralContract, [
    receiver.address,
    PAYMENT_AMOUNT,
    REFERRAL_REWARD,
  ]);

  // get deployer / signer address that deploys the contract
  const adminAddress = await proxyContract.signer.getAddress();

  // wait for contract to be deployed
  const deployedProxyContract = await proxyContract.deployed();

  // log message
  console.log(
    ` ${adminAddress} deployed ${CONTRACT} contract to ${deployedProxyContract.address}\n`
  );

  // time measuring
  const endTime = performance.now();

  // create (write & store) log files of deployments for overview
  const logInput = {
    date: new Date(),
    contract: CONTRACT,
    contractAddress: deployedProxyContract.address,
    signer: adminAddress,
    durationInMs: endTime - startTime,
  };
  const logInputFile: string = "upgradable-contract-deployments.json";
  writeLogFile({
    filePath: logInputFile,
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
