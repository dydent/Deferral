import { ethers } from "hardhat";
import { ethConverter } from "../helpers/converters";
import { getNetworkInfo } from "../helpers/get-network-info";
import { writeLogFile } from "../helpers/write-files";
import { ReferralPaymentProxy } from "../typechain";
import { resolveNetworkIds } from "../helpers/resolve-network-ids";

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
  console.log(`Deploying referral contract to ${networkName} network...\n`);

  // deploy contract --> deployer account signs this transaction
  const referralContract = await ethers.getContractFactory(
    "ReferralPaymentProxy"
  );

  // get deployer / signer address that deploys the contract
  const contractSignerAddress = await referralContract.signer.getAddress();

  // deploy contract
  const deployedReferralContract = await referralContract.deploy(
    receiver.address,
    PAYMENT_AMOUNT,
    REFERRAL_REWARD
  );

  // wait for contract to be deployed
  await deployedReferralContract.deployed();

  // log message
  console.log(
    ` ${contractSignerAddress} deployed ReferralPaymentProxy contract to ${deployedReferralContract.address}\n`
  );

  // time measuring
  const endTime = performance.now();

  // create (write & store) log files of deployments for overview
  const logInput = {
    date: new Date(),
    contract: "V1 ReferralPaymentProxy",
    contractAddress: deployedReferralContract.address,
    signer: contractSignerAddress,
    durationInMs: endTime - startTime,
  };
  const logInputFile: string = "deployedContracts.json";

  writeLogFile({
    filePath: logInputFile,
    jsonInput: logInput,
    chainID: networkId,
    chainName: networkName,
  });
}

// catch errors
main().catch((error) => {
  console.error(`Something went wrong with the deployment:\n`, error);
  process.exitCode = 1;
});
