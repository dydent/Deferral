// helper function to deploy the referral contract
import { ethers, upgrades } from "hardhat";
import { ethConverter } from "../converters";

import {
  deployUpgradableContractHelper,
  upgradeUpgradableContractHelper,
} from "../deployer-functions/deploy-upgradable-contract-helper";
import {
  UpgradableV1ReferralPaymentTransmitter,
  UpgradableV2ReferralPaymentTransmitter,
} from "../../typechain-types";
import { DeployAndUpgradePaymentTransmitterFixtureReturnType } from "../../types/fixture-types/UpgradablePaymentTransmitterFixtureTypes";

export const INITIAL_UPGRADABLE_PAYMENT_TRANSMITTER =
  "UpgradableV1ReferralPaymentTransmitter";
export const UPGRADABLE_PAYMENT_TRANSMITTER =
  "UpgradableV2ReferralPaymentTransmitter";

export const UPGRADABLE_PAYMENT_AMOUNT: number = 10;
export const UPGRADABLE_REFERRAL_REWARD = 1;
export const UPGRADABLE_PRIZE =
  UPGRADABLE_PAYMENT_AMOUNT - UPGRADABLE_REFERRAL_REWARD;

// helper function to deploy and upgrade the contracts
export async function deployAndUpgradeUpgradablePaymentTransmitterFixture(): Promise<
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
        contractName: INITIAL_UPGRADABLE_PAYMENT_TRANSMITTER,
        initArgs: [
          receiver.address,
          ethConverter(UPGRADABLE_PAYMENT_AMOUNT),
          ethConverter(UPGRADABLE_REFERRAL_REWARD),
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
        upgradedImplementationContractName: UPGRADABLE_PAYMENT_TRANSMITTER,
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
