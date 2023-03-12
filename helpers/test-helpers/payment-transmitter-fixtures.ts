import { ethers, upgrades } from "hardhat";
import { deployContractHelper } from "../deployer-functions/deploy-contract-helper";
import { ethConverter } from "../converters";
import {
  UpgradableV1ReferralPaymentTransmitter,
  UpgradableV2ReferralPaymentTransmitter,
  V1ReferralPaymentTransmitter,
} from "../../typechain-types";
import { PaymentTransmitterFixtureReturnType } from "../../types/fixture-types/PaymentTransmitterFixtureTypes";
import {
  deployUpgradableContractHelper,
  upgradeUpgradableContractHelper,
} from "../deployer-functions/deploy-upgradable-contract-helper";
import { DeployAndUpgradePaymentTransmitterFixtureReturnType } from "../../types/fixture-types/UpgradablePaymentTransmitterFixtureTypes";

type PaymentTransmitterFixtureInputType = {
  contractName: string;
  paymentAmount: number;
  referralReward: number;
};

// Fixture for testing V1 Payment Transmitter
export async function deployV1ReferralPaymentTransmitterFixture({
  contractName,
  paymentAmount,
  referralReward,
}: PaymentTransmitterFixtureInputType): Promise<
  PaymentTransmitterFixtureReturnType<V1ReferralPaymentTransmitter>
> {
  const [admin, receiver, updatedReceiver, referrer, referee] =
    await ethers.getSigners();

  const deployedContract =
    await deployContractHelper<V1ReferralPaymentTransmitter>({
      contractName: contractName,
      constructorParams: [
        receiver.address,
        ethConverter(paymentAmount),
        ethConverter(referralReward),
      ],
    });

  return {
    admin,
    receiver,
    updatedReceiver,
    referrer,
    referee,
    deployedContract,
  };
}

// Fixture for testing V1 & V2 Upgradable Payment Transmitters
export async function deployAndUpgradeUpgradablePaymentTransmitterFixture({
  contractName,
  upgradedContractName,
  paymentAmount,
  referralReward,
}: PaymentTransmitterFixtureInputType & {
  upgradedContractName: string;
}): Promise<
  DeployAndUpgradePaymentTransmitterFixtureReturnType<
    UpgradableV1ReferralPaymentTransmitter,
    UpgradableV2ReferralPaymentTransmitter
  >
> {
  const [admin, receiver, updatedReceiver, referrer, referee] =
    await ethers.getSigners();

  // deploy proxy contract
  const proxyContract =
    await deployUpgradableContractHelper<UpgradableV1ReferralPaymentTransmitter>(
      {
        contractName: contractName,
        initArgs: [
          receiver.address,
          ethConverter(paymentAmount),
          ethConverter(referralReward),
        ],
      }
    );

  // get contract related data
  // proxy contract address
  const proxyContractAddress: string = proxyContract.address;
  // admin of all the upgrades contracts (proxyContract / implementationContract / proxyAdminContract
  const adminAddress: string = await proxyContract.signer.getAddress();
  // current implementation contract address
  const initialImplementationContractAddress: string =
    await upgrades.erc1967.getImplementationAddress(proxyContract.address);
  // address of the proxy admin contract  (typed as the underlying implementation contract)
  const proxyAdminContractAddress: string =
    await upgrades.erc1967.getAdminAddress(proxyContract.address);

  // upgrade proxy contract
  const upgradedProxyContract: UpgradableV2ReferralPaymentTransmitter =
    await upgradeUpgradableContractHelper<UpgradableV2ReferralPaymentTransmitter>(
      {
        proxyContract,
        upgradedImplementationContractName: upgradedContractName,
      }
    );

  // get implementation address of updated contract
  // !!! implementation contract only changes if there are changes in the contract !!!
  const upgradedImplementationAddress: string =
    await upgrades.erc1967.getImplementationAddress(proxyContract.address);

  return {
    admin,
    receiver,
    updatedReceiver,
    referrer,
    referee,
    proxyContract,
    proxyContractAddress,
    adminAddress,
    initialImplementationContractAddress,
    proxyAdminContractAddress,
    upgradedProxyContract,
    upgradedImplementationAddress,
  };
}
