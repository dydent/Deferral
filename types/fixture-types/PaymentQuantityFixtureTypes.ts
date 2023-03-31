import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {} from "../../typechain-types";
import { BaseContract, BigNumber } from "ethers";
import { PercentageType } from "../PercentageTypes";

export type PaymentQuantityFixtureInputType = {
  contractName: string;
  referralPercentage: PercentageType;
  quantityThreshold: BigNumber;
};

export type PaymentQuantityFixtureReturnType<T extends BaseContract> = {
  admin: SignerWithAddress;
  receiver: SignerWithAddress;
  updatedReceiver: SignerWithAddress;
  referrer: SignerWithAddress;
  referee: SignerWithAddress;
  proxyContract: T;
};
