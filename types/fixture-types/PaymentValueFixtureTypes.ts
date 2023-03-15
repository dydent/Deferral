import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { V1ReferralPaymentValueUpgradable } from "../../typechain-types";

export type PaymentValueFixtureInputType = {
  contractName: string;
  referralPercentage: number;
  // value in ETHER
  valueThreshold: number;
};

export type PaymentValueFixtureReturnType = {
  admin: SignerWithAddress;
  receiver: SignerWithAddress;
  updatedReceiver: SignerWithAddress;
  referrer: SignerWithAddress;
  referee: SignerWithAddress;
  proxyContract: V1ReferralPaymentValueUpgradable;
};
