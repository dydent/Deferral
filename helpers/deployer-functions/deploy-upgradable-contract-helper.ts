import { ethers, upgrades } from "hardhat";
import { BaseContract, ContractFactory } from "ethers";
import { ContractAddressOrInstance } from "@openzeppelin/hardhat-upgrades/dist/utils";

// -----------------------------------------------------------------------------------------------
// helper function for deploying upgradable smart contracts
// -----------------------------------------------------------------------------------------------

type DeploymentInputType = {
  contractName: string;
  initArgs: any[];
};

type UpgradeInputType = {
  proxyContract: ContractAddressOrInstance;
  upgradedImplementationContractName: string;
};

export const deployUpgradableContractHelper = async <
  ContractType extends BaseContract
>({
  contractName,
  initArgs,
}: DeploymentInputType): Promise<ContractType> => {
  const referralContract = await ethers.getContractFactory(contractName);

  const deployedProxyContract: ContractType = (await upgrades.deployProxy(
    referralContract,
    [...initArgs]
  )) as ContractType;

  await deployedProxyContract.deployed();

  return deployedProxyContract;
};

export const upgradeUpgradableContractHelper = async <
  ContractType extends BaseContract
>({
  proxyContract,
  upgradedImplementationContractName,
}: UpgradeInputType): Promise<ContractType> => {
  const upgradedImplementationContract: ContractFactory =
    await ethers.getContractFactory(upgradedImplementationContractName);

  const upgradedProxyContract: ContractType = (await upgrades.upgradeProxy(
    proxyContract,
    upgradedImplementationContract
  )) as ContractType;

  await upgradedProxyContract.deployed();

  return upgradedProxyContract;
};
