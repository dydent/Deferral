import { BaseContract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export type PaymentTransmitterFixtureReturnType<T extends BaseContract> = {
  admin: SignerWithAddress;
  receiver: SignerWithAddress;
  updatedReceiver: SignerWithAddress;
  referrer: SignerWithAddress;
  referee: SignerWithAddress;
  deployedContract: T;
};
