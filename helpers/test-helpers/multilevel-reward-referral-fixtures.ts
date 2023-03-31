// helper function to deploy the referral contract
import { ethers } from "hardhat";
import { deployUpgradableContractHelper } from "../deployer-functions/deploy-upgradable-contract-helper";
import { etherUnitConverter } from "../unit-converters";
import {
  MultilevelRewardReferralFixtureInputType,
  MultilevelRewardReferralFixtureReturnType,
  V2MultilevelRewardReferralFixtureInputType,
} from "../../types/fixture-types/MultilevelRewardReferralFixtureTypes";
import { V2ReferralMultilevelRewardsUpgradable } from "../../typechain-types";
import { BaseContract } from "ethers";

// -----------------------------------------------------------------------------------------------
// Fixture helper functions for testing multilevel reward referral contracts
// -----------------------------------------------------------------------------------------------

export async function deployMultilevelReferralRewardFixture<
  T extends BaseContract
>({
  contractName,
  unit,
  referralPercentage,
  paymentQuantityThreshold,
  paymentValueThreshold,
}: MultilevelRewardReferralFixtureInputType): Promise<
  MultilevelRewardReferralFixtureReturnType<T>
> {
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
  const proxyContract = await deployUpgradableContractHelper<T>({
    contractName: contractName,
    initArgs: [
      receiver.address,
      referralPercentage,
      paymentQuantityThreshold,
      etherUnitConverter[unit](paymentValueThreshold),
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
  unit,
  referralPercentage,
  refereePercentage,
  paymentQuantityThreshold,
  paymentValueThreshold,
  maxRewardLevels,
}: V2MultilevelRewardReferralFixtureInputType): Promise<
  MultilevelRewardReferralFixtureReturnType<V2ReferralMultilevelRewardsUpgradable>
> {
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
    await deployUpgradableContractHelper<V2ReferralMultilevelRewardsUpgradable>(
      {
        contractName: contractName,
        initArgs: [
          receiver.address,
          referralPercentage,
          refereePercentage,
          paymentQuantityThreshold,
          etherUnitConverter[unit](paymentValueThreshold),
          maxRewardLevels,
        ],
      }
    );

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
