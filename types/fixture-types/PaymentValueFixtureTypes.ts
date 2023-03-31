import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BaseContract, BigNumber } from "ethers";
import { PercentageType } from "../PercentageTypes";

export type PaymentValueFixtureInputType = {
  contractName: string;
  referralPercentage: PercentageType;
  // value in ETHER
  valueThreshold: BigNumber;
};

export type V3PaymentValueFixtureInputType = PaymentValueFixtureInputType & {
  refereeRewardPercentage: PercentageType;
};

export type PaymentValueFixtureReturnType<T extends BaseContract> = {
  admin: SignerWithAddress;
  receiver: SignerWithAddress;
  updatedReceiver: SignerWithAddress;
  referrer: SignerWithAddress;
  referee: SignerWithAddress;
  proxyContract: T;
};
