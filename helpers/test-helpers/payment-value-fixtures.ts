// helper function to deploy the referral contract
import { ethers } from "hardhat";
import { deployUpgradableContractHelper } from "../deployer-functions/deploy-upgradable-contract-helper";
import { V3ReferralPaymentValueUpgradable } from "../../typechain-types";
import {
  PaymentValueFixtureInputType,
  PaymentValueFixtureReturnType,
  V3PaymentValueFixtureInputType,
} from "../../types/fixture-types/PaymentValueFixtureTypes";
import { ethConverter } from "../unit-converters";
import { BaseContract } from "ethers";

// -----------------------------------------------------------------------------------------------
// Fixture helper functions for testing referral payment value contracts
// -----------------------------------------------------------------------------------------------

export async function deployPaymentValueUpgradableFixture<
  T extends BaseContract
>({
  contractName,
  referralPercentage,
  valueThreshold,
}: PaymentValueFixtureInputType): Promise<PaymentValueFixtureReturnType<T>> {
  const [admin, receiver, updatedReceiver, referrer, referee] =
    await ethers.getSigners();
  // deploy upgradable contracts
  const proxyContract = await deployUpgradableContractHelper<T>({
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

export async function deployV3PaymentValueUpgradableFixture({
  contractName,
  referralPercentage,
  refereeRewardPercentage,
  valueThreshold,
}: V3PaymentValueFixtureInputType): Promise<
  PaymentValueFixtureReturnType<V3ReferralPaymentValueUpgradable>
> {
  const [admin, receiver, updatedReceiver, referrer, referee] =
    await ethers.getSigners();
  // deploy upgradable contracts
  const proxyContract =
    await deployUpgradableContractHelper<V3ReferralPaymentValueUpgradable>({
      contractName: contractName,
      initArgs: [
        receiver.address,
        referralPercentage,
        refereeRewardPercentage,
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
