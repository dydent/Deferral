import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import { V1ReferralQuantityPaymentUpgradable } from "../../typechain-types";

export type PaymentQuantityFixtureReturnType = {
    admin: SignerWithAddress;
    receiver: SignerWithAddress;
    referrer: SignerWithAddress;
    referee: SignerWithAddress;
    proxyContract: V1ReferralQuantityPaymentUpgradable;
};