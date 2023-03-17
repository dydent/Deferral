// helper function to execute payments to the referral contract n times
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethConverter } from "../converters";
import {
  V1ReferralPaymentEvaluatorUpgradable,
  V1ReferralPaymentValueUpgradable,
  V1ReferralQuantityPaymentUpgradable,
  V2ReferralQuantityPaymentUpgradable,
} from "../../typechain-types";

type ValidContractType =
  | V1ReferralPaymentValueUpgradable
  | V2ReferralQuantityPaymentUpgradable
  | V1ReferralQuantityPaymentUpgradable
  | V1ReferralPaymentEvaluatorUpgradable;

// helper functions for executing N payment transactions to different referral contracts
export async function executeReferralPayment({
  executions,
  referee,
  referrer,
  proxyContract,
  paymentValue,
}: {
  executions: number;
  referee: SignerWithAddress;
  referrer: SignerWithAddress;
  proxyContract: ValidContractType;
  paymentValue: number | number[];
}): Promise<void> {
  for (let i = 0; i < executions; i++) {
    const referrerAddress = await referrer.getAddress();
    const value = Array.isArray(paymentValue) ? paymentValue[i] : paymentValue;
    // await referral process
    await proxyContract
      .connect(referee)
      .registerReferralPayment(referrerAddress, {
        value: ethConverter(value),
      });
  }
}
