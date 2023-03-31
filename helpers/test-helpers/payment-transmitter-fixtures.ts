import { ethers, upgrades } from "hardhat";
import { deployContractHelper } from "../deployer-functions/deploy-contract-helper";
import {
  V1ReferralPaymentTransmitter,
  V2ReferralPaymentTransmitterUpgradable,
  V3ReferralPaymentTransmitterUpgradable,
} from "../../typechain-types";
import {
  PaymentTransmitterFixtureInputType,
  PaymentTransmitterFixtureReturnType,
  UpgradablePaymentTransmitterFixtureReturnType,
} from "../../types/fixture-types/PaymentTransmitterFixtureTypes";
import {
  deployUpgradableContractHelper,
  upgradeUpgradableContractHelper,
} from "../deployer-functions/deploy-upgradable-contract-helper";
import { DeployAndUpgradePaymentTransmitterFixtureReturnType } from "../../types/fixture-types/UpgradablePaymentTransmitterFixtureTypes";
import { BaseContract } from "ethers";

// -----------------------------------------------------------------------------------------------
// Fixture helper functions for testing referral payment transmitter contracts
// -----------------------------------------------------------------------------------------------

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
  // deploy regular contract
  const deployedContract =
    await deployContractHelper<V1ReferralPaymentTransmitter>({
      contractName: contractName,
      constructorParams: [receiver.address, paymentAmount, referralReward],
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

// Fixture for testing V1 Upgradable Payment Transmitters
export async function deployUpgradableReferralPaymentTransmitter<
  UpgradableContractType extends BaseContract
>({
  contractName,
  paymentAmount,
  referralReward,
}: PaymentTransmitterFixtureInputType): Promise<
  UpgradablePaymentTransmitterFixtureReturnType<UpgradableContractType>
> {
  const [admin, receiver, updatedReceiver, referrer, referee] =
    await ethers.getSigners();
  // deploy upgradable contracts
  const proxyContract =
    await deployUpgradableContractHelper<UpgradableContractType>({
      contractName: contractName,
      initArgs: [receiver.address, paymentAmount, referralReward],
    });

  return {
    admin,
    receiver,
    updatedReceiver,
    referrer,
    referee,
    proxyContract,
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
    V2ReferralPaymentTransmitterUpgradable,
    V3ReferralPaymentTransmitterUpgradable
  >
> {
  const [admin, receiver, updatedReceiver, referrer, referee] =
    await ethers.getSigners();
  // deploy upgradable contracts
  const proxyContract =
    await deployUpgradableContractHelper<V2ReferralPaymentTransmitterUpgradable>(
      {
        contractName: contractName,
        initArgs: [receiver.address, paymentAmount, referralReward],
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
  const upgradedProxyContract: V3ReferralPaymentTransmitterUpgradable =
    await upgradeUpgradableContractHelper<V3ReferralPaymentTransmitterUpgradable>(
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
