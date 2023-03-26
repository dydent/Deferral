import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { V1ReferralPaymentEvaluatorUpgradable } from "../../typechain-types";

export type ReferralPaymentEvaluatorFixtureInputType = {
  contractName: string;
  referralPercentage: number;
  paymentQuantityThreshold: number;
  paymentValueThreshold: number;
};

export type ReferralPaymentEvaluatorFixtureReturnType = {
  admin: SignerWithAddress;
  receiver: SignerWithAddress;
  updatedReceiver: SignerWithAddress;
  referrer: SignerWithAddress;
  referee: SignerWithAddress;
  proxyContract: V1ReferralPaymentEvaluatorUpgradable;
};
