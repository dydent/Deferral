import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BaseContract } from "ethers";

export type PaymentValueFixtureInputType = {
  contractName: string;
  referralPercentage: number;
  // value in ETHER
  valueThreshold: number;
};

export type V3PaymentValueFixtureInputType = PaymentValueFixtureInputType & {
  refereeRewardPercentage: number;
};

export type PaymentValueFixtureReturnType<T extends BaseContract> = {
  admin: SignerWithAddress;
  receiver: SignerWithAddress;
  updatedReceiver: SignerWithAddress;
  referrer: SignerWithAddress;
  referee: SignerWithAddress;
  proxyContract: T;
};
