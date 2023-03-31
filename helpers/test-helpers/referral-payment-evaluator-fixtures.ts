// helper function to deploy the referral contract
import { ethers } from "hardhat";
import { deployUpgradableContractHelper } from "../deployer-functions/deploy-upgradable-contract-helper";
import { ethConverter } from "../unit-converters";
import { V1ReferralPaymentEvaluatorUpgradable } from "../../typechain-types";
import {
  ReferralPaymentEvaluatorFixtureInputType,
  ReferralPaymentEvaluatorFixtureReturnType,
} from "../../types/fixture-types/ReferralPaymentEvaluatorTypes";

// -----------------------------------------------------------------------------------------------
// Fixture helper functions for testing referral payment evaluator referral contracts
// -----------------------------------------------------------------------------------------------

export async function deployReferralPaymentEvaluatorFixture({
  contractName,
  referralPercentage,
  paymentQuantityThreshold,
  paymentValueThreshold,
}: ReferralPaymentEvaluatorFixtureInputType): Promise<ReferralPaymentEvaluatorFixtureReturnType> {
  const [admin, receiver, updatedReceiver, referrer, referee] =
    await ethers.getSigners();

  // deploy proxy contract
  const proxyContract =
    await deployUpgradableContractHelper<V1ReferralPaymentEvaluatorUpgradable>({
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
    referrer,
    referee,
    proxyContract,
  };
}
