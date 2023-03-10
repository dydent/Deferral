import {BaseContract} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

export type DeployAndUpgradePaymentTransmitterFixtureReturnType<T1 extends BaseContract, T2 extends BaseContract> = {
    admin: SignerWithAddress,
    receiver: SignerWithAddress,
    updatedReceiver: SignerWithAddress,
    referrer: SignerWithAddress,
    referee: SignerWithAddress,
    proxyContract: T1,
    proxyContractAddress: string,
    adminAddress: string,
    initialImplementationContractAddress: string,
    proxyAdminContractAddress: string,
    upgradedProxyContract: T2,
    upgradedImplementationAddress: string
}