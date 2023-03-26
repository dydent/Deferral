import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  
} from "../../typechain-types";
import { BaseContract } from "ethers";

export type PaymentQuantityFixtureInputType = {
  contractName: string;
  referralPercentage: number;
  quantityThreshold: number;
};

export type PaymentQuantityFixtureReturnType<T extends BaseContract> = {
  admin: SignerWithAddress;
  receiver: SignerWithAddress;
  updatedReceiver: SignerWithAddress;
  referrer: SignerWithAddress;
  referee: SignerWithAddress;
  proxyContract: T;
};
