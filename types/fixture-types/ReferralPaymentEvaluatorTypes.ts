import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {ReferralPaymentEvaluatorUpgradable, V1ReferralQuantityPaymentUpgradable } from "../../typechain-types";

export type ReferralPaymentEvaluatorFixtureInputType = {
    contractName: string;
    referralPercentage: number;
    paymentQuantityThreshold: number;
    paymentValueThreshold: number;
};

export type ReferralPaymentEvaluatorFixtureReturnType = {
    admin: SignerWithAddress;
    receiver: SignerWithAddress;
    updatedReceiver: SignerWithAddress;
    referrer: SignerWithAddress;
    referee: SignerWithAddress;
    proxyContract: ReferralPaymentEvaluatorUpgradable;
};
