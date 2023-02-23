import { ethers } from "hardhat";
import { ethConverter } from "../helpers/converters";

const PAYMENT_AMOUNT = ethConverter(10);
const REFERRAL_REWARD = ethConverter(1);

async function main() {
  const [receiver] = await ethers.getSigners(); // Get the deployer's account
  // const contractParams = {receiver: receiver.address, paymentAmount: }

  // Deploy contract
  const referralContract = await ethers.getContractFactory(
    "ReferralPaymentProxy"
  );

  const deployedReferralContract = await referralContract.deploy(
    receiver.address,
    PAYMENT_AMOUNT,
    REFERRAL_REWARD
  );
  await deployedReferralContract.deployed(); // Wait for contract deployment to complete
  console.log(
    "ReferralPaymentProxy deployed to:",
    deployedReferralContract.address
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error("Something went wrong with the deployment", error);
  process.exitCode = 1;
});
