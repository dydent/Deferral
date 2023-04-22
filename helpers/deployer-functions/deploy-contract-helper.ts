import { ethers } from "hardhat";
import { BaseContract } from "ethers";

// -----------------------------------------------------------------------------------------------
// helper function for deploying regular smart contracts
// -----------------------------------------------------------------------------------------------

type DeploymentInputType = {
  contractName: string;
  constructorParams: any[];
};

// function takes the contract name and its constructor parameters as inputs and deploy the regular smart contract
export const deployContractHelper = async <ContractType extends BaseContract>({
  contractName,
  constructorParams,
}: DeploymentInputType): Promise<ContractType> => {
  // get the contract factory for the specified contract name
  const referralContract = await ethers.getContractFactory(contractName);

  // deploy the contract using the factory and provided constructor parameters
  const deployedContract = (await referralContract.deploy(
    ...constructorParams
  )) as ContractType;

  // wait for the contract deployment transaction to be mined
  await deployedContract.deployed();

  // return the deployed contract instance
  return deployedContract;
};
