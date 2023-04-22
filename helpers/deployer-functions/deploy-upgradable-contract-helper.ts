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

// this function takes the contract name and its constructor parameters as inputs and deploy the regular smart contract

// this function takes the contract name and its initialization arguments and function
// it deploys an upgradable contract using the ethers library and the OpenZeppelin upgrades plugin
export const deployUpgradableContractHelper = async <
  ContractType extends BaseContract
>({
  contractName,
  initArgs,
}: DeploymentInputType): Promise<ContractType> => {
  // get the contract factory for the specified contract name
  const referralContract = await ethers.getContractFactory(contractName);

  // deploy the proxy, implementation contract, etc... using the factory upgrades from Openzeppelin
  // with the OpenZeppelin upgrades plugin
  const deployedProxyContract: ContractType = (await upgrades.deployProxy(
    referralContract,
    [...initArgs]
  )) as ContractType;

  // wait for the contract deployment transaction to be mined
  await deployedProxyContract.deployed();

  // return the deployed contract instance
  return deployedProxyContract;
};

// helper function to upgrade / update an upgradable contract with a new implementation
export const upgradeUpgradableContractHelper = async <
  ContractType extends BaseContract
>({
  proxyContract,
  upgradedImplementationContractName,
}: UpgradeInputType): Promise<ContractType> => {
  // get the contract factory for the upgraded implementation contract
  const upgradedImplementationContract: ContractFactory =
    await ethers.getContractFactory(upgradedImplementationContractName);

  // upgrade the proxy contract using the OpenZeppelin upgrades plugin
  const upgradedProxyContract: ContractType = (await upgrades.upgradeProxy(
    proxyContract,
    upgradedImplementationContract
  )) as ContractType;

  // wait for the contract upgrade transaction to be mined
  await upgradedProxyContract.deployed();

  // return the upgraded contract instance
  return upgradedProxyContract;
};
