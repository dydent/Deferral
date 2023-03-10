import { ethers } from "hardhat";
import { deployContractHelper } from "../deployer-functions/deploy-contract-helper";
import { ethConverter } from "../converters";
import { V1ReferralPaymentTransmitter } from "../../typechain-types";
import { PaymentTransmitterFixtureReturnType } from "../../types/fixture-types/PaymentTransmitterFixtureTypes";

export const PAYMENT_TRANSMITTER_CONTRACT = "V1ReferralPaymentTransmitter";

export const PAYMENT_AMOUNT = 10;
export const REFERRAL_REWARD = 1;
export const PRICE = PAYMENT_AMOUNT - REFERRAL_REWARD;

// Fixture for testing Payment Proxy
export async function deployV1ReferralPaymentTransmitterFixture(): Promise<
  PaymentTransmitterFixtureReturnType<V1ReferralPaymentTransmitter>
> {
  const [admin, receiver, updatedReceiver, referrer, referee] =
    await ethers.getSigners();

  const deployedContract =
    await deployContractHelper<V1ReferralPaymentTransmitter>({
      contractName: PAYMENT_TRANSMITTER_CONTRACT,
      constructorParams: [
        receiver.address,
        ethConverter(PAYMENT_AMOUNT),
        ethConverter(REFERRAL_REWARD),
      ],
    });

  return {
    admin,
    receiver,
    updatedReceiver,
    referrer,
    referee,
    deployedContract,
  };
}
