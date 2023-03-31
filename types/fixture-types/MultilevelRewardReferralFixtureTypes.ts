import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BaseContract, BigNumber } from "ethers";
import { PercentageType } from "../PercentageTypes";
import { ValidUnitType } from "../ValidUnitTypes";

export type MultilevelRewardReferralFixtureInputType = {
  unit: ValidUnitType;
  contractName: string;
  referralPercentage: PercentageType;
  paymentQuantityThreshold: BigNumber;
  paymentValueThreshold: BigNumber;
};

export type MultilevelRewardReferralFixtureReturnType<T extends BaseContract> =
  {
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

export type V2MultilevelRewardReferralFixtureInputType =
  MultilevelRewardReferralFixtureInputType & {
    refereePercentage: PercentageType;
    maxRewardLevels: BigNumber;
  };
