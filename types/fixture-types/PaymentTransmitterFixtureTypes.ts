import { BaseContract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export type PaymentTransmitterFixtureInputType = {
  contractName: string;
  paymentAmount: number;
  referralReward: number;
};

export type PaymentTransmitterFixtureReturnType<T extends BaseContract> = {
  admin: SignerWithAddress;
  receiver: SignerWithAddress;
  updatedReceiver: SignerWithAddress;
  referrer: SignerWithAddress;
  referee: SignerWithAddress;
  deployedContract: T;
};

export type UpgradablePaymentTransmitterFixtureReturnType<T> = {
  admin: SignerWithAddress;
  receiver: SignerWithAddress;
  updatedReceiver: SignerWithAddress;
  referrer: SignerWithAddress;
  referee: SignerWithAddress;
  proxyContract: T;
};
