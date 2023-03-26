import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {BaseContract} from "ethers";

export type MultilevelRewardReferralFixtureInputType = {
  contractName: string;
  referralPercentage: number;
  paymentQuantityThreshold: number;
  paymentValueThreshold: number;
};

export type MultilevelRewardReferralFixtureReturnType<T extends BaseContract> = {
  admin: SignerWithAddress;
  receiver: SignerWithAddress;
  updatedReceiver: SignerWithAddress;
  rootReferrer: SignerWithAddress;
  rootReferrer2: SignerWithAddress;
  referee: SignerWithAddress;
  referee2: SignerWithAddress;
  referee3: SignerWithAddress;
  referee4: SignerWithAddress;
  finalReferee: SignerWithAddress;
  proxyContract: T;
};

export type V2MultilevelRewardReferralFixtureInputType = MultilevelRewardReferralFixtureInputType &{
  refereePercentage: number;
  maxRewardLevels: number

};

