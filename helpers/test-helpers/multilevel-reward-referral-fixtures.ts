// helper function to deploy the referral contract
import { ethers } from "hardhat";
import { deployUpgradableContractHelper } from "../deployer-functions/deploy-upgradable-contract-helper";
import { ethConverter } from "../converters";
import {
  V1MultilevelRewardReferralFixtureInputType,
  V1MultilevelRewardReferralFixtureReturnType,
  V2MultilevelRewardReferralFixtureInputType,
  V2MultilevelRewardReferralFixtureReturnType,
} from "../../types/fixture-types/MultilevelRewardReferralFixtureTypes";
import { V1MultilevelRewardReferralUpgradable } from "../../typechain-types/contracts/referral-evaluators/referral-payment-multilevel-rewards/V1MultilevelRewardReferralUpgradable";
import { V2MultilevelRewardReferralUpgradable } from "../../typechain-types";

// -----------------------------------------------------------------------------------------------
// Fixture helper functions for testing multilevel reward referral contracts
// -----------------------------------------------------------------------------------------------

export async function deployV1MultilevelReferralRewardFixture({
  contractName,
  referralPercentage,
  paymentQuantityThreshold,
  paymentValueThreshold,
}: V1MultilevelRewardReferralFixtureInputType): Promise<V1MultilevelRewardReferralFixtureReturnType> {
  const [
    admin,
    receiver,
    updatedReceiver,
    rootReferrer,
    rootReferrer2,
    referee,
    referee2,
    referee3,
    referee4,
    finalReferee,
  ] = await ethers.getSigners();

  // deploy proxy contract
  const proxyContract =
    await deployUpgradableContractHelper<V1MultilevelRewardReferralUpgradable>({
      contractName: contractName,
      initArgs: [
        receiver.address,
        referralPercentage,
        paymentQuantityThreshold,
        ethConverter(paymentValueThreshold),
      ],
    });

  return {
    admin,
    receiver,
    updatedReceiver,
    rootReferrer,
    rootReferrer2,
    referee,
    referee2,
    referee3,
    referee4,
    finalReferee,
    proxyContract,
  };
}

export async function deployV2MultilevelReferralRewardFixture({
  contractName,
  referralPercentage,
  refereeRewardAllocationPercentage,
  paymentQuantityThreshold,
  paymentValueThreshold,
}: V2MultilevelRewardReferralFixtureInputType): Promise<V2MultilevelRewardReferralFixtureReturnType> {
  const [
    admin,
    receiver,
    updatedReceiver,
    rootReferrer,
    rootReferrer2,
    referee,
    referee2,
    referee3,
    referee4,
    finalReferee,
  ] = await ethers.getSigners();

  // deploy proxy contract
  const proxyContract =
    await deployUpgradableContractHelper<V2MultilevelRewardReferralUpgradable>({
      contractName: contractName,
      initArgs: [
        receiver.address,
        referralPercentage,
        refereeRewardAllocationPercentage,
        paymentQuantityThreshold,
        ethConverter(paymentValueThreshold),
      ],
    });

  return {
    admin,
    receiver,
    updatedReceiver,
    rootReferrer,
    rootReferrer2,
    referee,
    referee2,
    referee3,
    referee4,
    finalReferee,
    proxyContract,
  };
}
