// helper function to deploy the referral contract
import { ethers } from "hardhat";
import { deployUpgradableContractHelper } from "../deployer-functions/deploy-upgradable-contract-helper";
import { ethConverter } from "../converters";
import {
  MultilevelRewardReferralFixtureInputType,
  MultilevelRewardReferralFixtureReturnType,
} from "../../types/fixture-types/MultilevelRewardReferralFixtureTypes";
import { V1MultilevelRewardReferralUpgradable } from "../../typechain-types/contracts/referral-evaluators/referral-payment-multilevel-rewards/V1MultilevelRewardReferralUpgradable";

// -----------------------------------------------------------------------------------------------
// Fixture helper functions for testing multilevel reward referral contracts
// -----------------------------------------------------------------------------------------------

export async function deployMultilevelReferralRewardFixture({
  contractName,
  referralPercentage,
  paymentQuantityThreshold,
  paymentValueThreshold,
}: MultilevelRewardReferralFixtureInputType): Promise<MultilevelRewardReferralFixtureReturnType> {
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
