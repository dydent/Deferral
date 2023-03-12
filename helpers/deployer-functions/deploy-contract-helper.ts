import { ethers } from "hardhat";
import { BaseContract } from "ethers";

type DeploymentInputType = {
  contractName: string;
  constructorParams: any[];
};

export const deployContractHelper = async <ContractType extends BaseContract>({
  contractName,
  constructorParams,
}: DeploymentInputType): Promise<ContractType> => {
  const referralContract = await ethers.getContractFactory(contractName);

  const deployedContract = (await referralContract.deploy(
    ...constructorParams
  )) as ContractType;

  await deployedContract.deployed();

  return deployedContract;
};
