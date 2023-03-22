import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { V2MultilevelRewardReferralUpgradable } from "../../typechain-types";
import { V1MultilevelRewardReferralUpgradable } from "../../typechain-types/contracts/referral-evaluators/referral-payment-multilevel-rewards/V1MultilevelRewardReferralUpgradable";

export type V1MultilevelRewardReferralFixtureInputType = {
    contractName: string;
    referralPercentage: number;
    paymentQuantityThreshold: number;
    paymentValueThreshold: number;
};

export type V1MultilevelRewardReferralFixtureReturnType = {
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
    proxyContract: V1MultilevelRewardReferralUpgradable;
};



export type V2MultilevelRewardReferralFixtureInputType = {
    contractName: string;
    referralPercentage: number;
    refereeRewardAllocationPercentage: number;
    paymentQuantityThreshold: number;
    paymentValueThreshold: number;
};

export type V2MultilevelRewardReferralFixtureReturnType = {
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
    proxyContract: V2MultilevelRewardReferralUpgradable;
};
