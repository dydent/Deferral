import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { V1ReferralPaymentValueUpgradable, V2ReferralPaymentValueUpgradable } from "../../typechain-types";

export type PaymentValueFixtureInputType = {
  contractName: string;
  referralPercentage: number;
  // value in ETHER
  valueThreshold: number;
};

export type V1PaymentValueFixtureReturnType = {
  admin: SignerWithAddress;
  receiver: SignerWithAddress;
  updatedReceiver: SignerWithAddress;
  referrer: SignerWithAddress;
  referee: SignerWithAddress;
  proxyContract: V1ReferralPaymentValueUpgradable;
};

export type V2PaymentValueFixtureReturnType = {
  admin: SignerWithAddress;
  receiver: SignerWithAddress;
  updatedReceiver: SignerWithAddress;
  referrer: SignerWithAddress;
  referee: SignerWithAddress;
  proxyContract: V2ReferralPaymentValueUpgradable;
};

