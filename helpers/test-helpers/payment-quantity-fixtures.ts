// helper function to deploy the referral contract
import { ethers } from "hardhat";
import { deployUpgradableContractHelper } from "../deployer-functions/deploy-upgradable-contract-helper";
import { V1ReferralQuantityPaymentUpgradable } from "../../typechain-types";
import { PaymentQuantityFixtureReturnType } from "../../types/fixture-types/PaymentQuantityFixtureTypes";

export const PAYMENT_QUANTITY_AMOUNT_CONTRACT =
  "V1ReferralQuantityPaymentUpgradable";

export const QUANTITY_PAYMENT_AMOUNT = 10;
export const REFERRAL_PERCENTAGE = 50;
export const QUANTITY_PAYMENT_AMOUNT_PRIZE =
  (QUANTITY_PAYMENT_AMOUNT / 100) * REFERRAL_PERCENTAGE;

export const QUANTITY_THRESHOLD = 2;

export async function deployPaymentQuantityUpgradableFixture(): Promise<PaymentQuantityFixtureReturnType> {
  const [admin, receiver, referrer, referee] = await ethers.getSigners();

  // deploy proxy contract
  const proxyContract =
    await deployUpgradableContractHelper<V1ReferralQuantityPaymentUpgradable>({
      contractName: PAYMENT_QUANTITY_AMOUNT_CONTRACT,
      initArgs: [receiver.address, REFERRAL_PERCENTAGE, QUANTITY_THRESHOLD],
    });

  return {
    admin,
    receiver,
    referrer,
    referee,
    proxyContract,
  };
}
