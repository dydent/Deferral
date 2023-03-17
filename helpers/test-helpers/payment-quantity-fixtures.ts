import { ethers } from "hardhat";
import { deployUpgradableContractHelper } from "../deployer-functions/deploy-upgradable-contract-helper";
import { V1ReferralQuantityPaymentUpgradable } from "../../typechain-types";
import {
  PaymentQuantityFixtureInputType,
  PaymentQuantityFixtureReturnType,
} from "../../types/fixture-types/PaymentQuantityFixtureTypes";

// -----------------------------------------------------------------------------------------------
// Fixture helper functions for testing referral payment quantity contracts
// -----------------------------------------------------------------------------------------------

export async function deployPaymentQuantityUpgradableFixture({
  contractName,
  referralPercentage,
  quantityThreshold,
}: PaymentQuantityFixtureInputType): Promise<PaymentQuantityFixtureReturnType> {
  const [admin, receiver, updatedReceiver, referrer, referee] =
    await ethers.getSigners();
  // deploy upgradable contracts
  const proxyContract =
    await deployUpgradableContractHelper<V1ReferralQuantityPaymentUpgradable>({
      contractName: contractName,
      initArgs: [receiver.address, referralPercentage, quantityThreshold],
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
