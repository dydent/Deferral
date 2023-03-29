// helper function to execute payments to the referral contract n times
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethConverter } from "../unit-converters";
import {
  V1ReferralPaymentEvaluatorUpgradable,
  V1ReferralPaymentQuantityUpgradable,
  V1ReferralPaymentValueUpgradable,
  V2ReferralPaymentQuantityUpgradable,
  V2ReferralPaymentValueUpgradable,
} from "../../typechain-types";
import { V3ReferralPaymentValueUpgradable } from "../../typechain-types/contracts/referral-evaluators/referral-payment-value/V3ReferralPaymentValueUpgradable";

type ValidContractType =
  | V1ReferralPaymentValueUpgradable
  | V2ReferralPaymentValueUpgradable
  | V3ReferralPaymentValueUpgradable
  | V1ReferralPaymentQuantityUpgradable
  | V2ReferralPaymentQuantityUpgradable
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
