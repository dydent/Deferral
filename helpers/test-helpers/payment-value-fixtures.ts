// helper function to deploy the referral contract
import { ethers } from "hardhat";
import { deployUpgradableContractHelper } from "../deployer-functions/deploy-upgradable-contract-helper";
import {
  V1ReferralPaymentValueUpgradable,
  V2ReferralPaymentValueUpgradable,
} from "../../typechain-types";
import {
  PaymentValueFixtureInputType,
  V1PaymentValueFixtureReturnType,
  V2PaymentValueFixtureReturnType,
} from "../../types/fixture-types/PaymentValueFixtureTypes";
import { ethConverter } from "../converters";

// -----------------------------------------------------------------------------------------------
// Fixture helper functions for testing referral payment value contracts
// -----------------------------------------------------------------------------------------------

export async function deployV1PaymentValueUpgradableFixture({
  contractName,
  referralPercentage,
  valueThreshold,
}: PaymentValueFixtureInputType): Promise<V1PaymentValueFixtureReturnType> {
  const [admin, receiver, updatedReceiver, referrer, referee] =
    await ethers.getSigners();
  // deploy upgradable contracts
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

export async function deployV2PaymentValueUpgradableFixture({
  contractName,
  referralPercentage,
  valueThreshold,
}: PaymentValueFixtureInputType): Promise<V2PaymentValueFixtureReturnType> {
  const [admin, receiver, updatedReceiver, referrer, referee] =
    await ethers.getSigners();
  // deploy upgradable contracts
  const proxyContract =
    await deployUpgradableContractHelper<V2ReferralPaymentValueUpgradable>({
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
