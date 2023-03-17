// helper function to deploy the referral contract
import { ethers } from "hardhat";
import { deployUpgradableContractHelper } from "../deployer-functions/deploy-upgradable-contract-helper";
import { ReferralPaymentEvaluatorUpgradable } from "../../typechain-types";

import {
  ReferralPaymentEvaluatorFixtureInputType,
  ReferralPaymentEvaluatorFixtureReturnType,
} from "../../types/fixture-types/ReferralPaymentEvaluatorTypes";
import { ethConverter } from "../converters";

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
    await deployUpgradableContractHelper<ReferralPaymentEvaluatorUpgradable>({
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
