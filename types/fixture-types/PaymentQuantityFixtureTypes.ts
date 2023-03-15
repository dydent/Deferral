import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { V1ReferralQuantityPaymentUpgradable } from "../../typechain-types";

export type PaymentQuantityFixtureInputType = {
  contractName: string;
  referralPercentage: number;
  quantityThreshold: number;
};

export type PaymentQuantityFixtureReturnType = {
  admin: SignerWithAddress;
  receiver: SignerWithAddress;
  updatedReceiver: SignerWithAddress;
  referrer: SignerWithAddress;
  referee: SignerWithAddress;
  proxyContract: V1ReferralQuantityPaymentUpgradable;
};
