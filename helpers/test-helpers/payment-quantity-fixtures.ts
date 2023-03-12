// helper function to deploy the referral contract
import { ethers } from "hardhat";
import { deployUpgradableContractHelper } from "../deployer-functions/deploy-upgradable-contract-helper";
import { V1ReferralQuantityPaymentUpgradable } from "../../typechain-types";
import { PaymentQuantityFixtureReturnType } from "../../types/fixture-types/PaymentQuantityFixtureTypes";

type PaymentQuantityFixtureInputType = {
  contractName: string;
  referralPercentage: number;
  quantityThreshold: number;
};

export async function deployPaymentQuantityUpgradableFixture({
  contractName,
  referralPercentage,
  quantityThreshold,
}: PaymentQuantityFixtureInputType): Promise<PaymentQuantityFixtureReturnType> {
  const [admin, receiver, referrer, referee] = await ethers.getSigners();

  // deploy proxy contract
  const proxyContract =
    await deployUpgradableContractHelper<V1ReferralQuantityPaymentUpgradable>({
      contractName: contractName,
      initArgs: [receiver.address, referralPercentage, quantityThreshold],
    });

  return {
    admin,
    receiver,
    referrer,
    referee,
    proxyContract,
  };
}
