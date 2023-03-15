// helper function to deploy the referral contract
import { ethers } from "hardhat";
import { deployUpgradableContractHelper } from "../deployer-functions/deploy-upgradable-contract-helper";
import { V1ReferralPaymentValueUpgradable } from "../../typechain-types";
import {
  PaymentValueFixtureInputType,
  PaymentValueFixtureReturnType,
} from "../../types/fixture-types/PaymentValueFixtureTypes";
import { ethConverter } from "../converters";

export async function deployPaymentValueUpgradableFixture({
  contractName,
  referralPercentage,
  valueThreshold,
}: PaymentValueFixtureInputType): Promise<PaymentValueFixtureReturnType> {
  const [admin, receiver, updatedReceiver, referrer, referee] =
    await ethers.getSigners();

  // deploy proxy contract
  const proxyContract =
    await deployUpgradableContractHelper<V1ReferralPaymentValueUpgradable>({
      contractName: contractName,
      initArgs: [
        receiver.address,
        referralPercentage,
        ethConverter(valueThreshold),
      ],
    });

  return {
    admin,
    receiver,
    updatedReceiver,
    referrer,
    referee,
    proxyContract,
  };
}
