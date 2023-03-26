import { ethers } from "hardhat";
import { deployUpgradableContractHelper } from "../deployer-functions/deploy-upgradable-contract-helper";
import {
  PaymentQuantityFixtureInputType,
  PaymentQuantityFixtureReturnType,
} from "../../types/fixture-types/PaymentQuantityFixtureTypes";
import { BaseContract } from "ethers";

// -----------------------------------------------------------------------------------------------
// Fixture helper functions for testing referral payment quantity contracts
// -----------------------------------------------------------------------------------------------

export async function deployPaymentQuantityUpgradableFixture<
  T extends BaseContract
>({
  contractName,
  referralPercentage,
  quantityThreshold,
}: PaymentQuantityFixtureInputType): Promise<
  PaymentQuantityFixtureReturnType<T>
> {
  const [admin, receiver, updatedReceiver, referrer, referee] =
    await ethers.getSigners();
  // deploy upgradable contracts
  const proxyContract = await deployUpgradableContractHelper<T>({
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
