// helper function to deploy the referral contract
import { ethers } from "hardhat";
import { deployUpgradableContractHelper } from "../deployer-functions/deploy-upgradable-contract-helper";
import { ERC20 } from "../../typechain-types";
import { BaseContract, BigNumber } from "ethers";
import {
  MultilevelTokenRewardReferralFixtureInputType,
  MultilevelTokenRewardReferralFixtureReturnType,
} from "../../types/fixture-types/MultilevelTokenRewardReferralFixtureTypes";

// -----------------------------------------------------------------------------------------------
// Fixture helper functions for testing multilevel reward referral contracts
// -----------------------------------------------------------------------------------------------

export async function deployMultilevelTokenReferralRewardFixture<
  ContractType extends BaseContract,
  TokenType extends BaseContract & ERC20
>({
  contractName,
  referralPercentage,
  refereePercentage,
  paymentQuantityThreshold,
  paymentValueThreshold,
  maxRewardLevels,
  tokenName,
  initialTokenSupply,
  tokenSupplyPerAccount,
}: MultilevelTokenRewardReferralFixtureInputType): Promise<
  MultilevelTokenRewardReferralFixtureReturnType<ContractType, TokenType>
> {
  const [
    admin,
    receiver,
    updatedReceiver,
    rootReferrer,
    rootReferrer2,
    referee,
    referee2,
    referee3,
    referee4,
    finalReferee,
  ] = await ethers.getSigners();

  // deploy token contract
  const TokenContract = await ethers.getContractFactory(tokenName);
  const deployedToken: TokenType = (await TokenContract.deploy(
    initialTokenSupply
  )) as TokenType;
  const tokenAddress: string = deployedToken.address;

  // request tokens with all returned accounts
  const accounts = [
    admin,
    receiver,
    updatedReceiver,
    rootReferrer,
    rootReferrer2,
    referee,
    referee2,
    referee3,
    referee4,
    finalReferee,
  ];

  // deploy proxy contract
  const proxyContract = await deployUpgradableContractHelper<ContractType>({
    contractName: contractName,
    initArgs: [
      tokenAddress,
      receiver.address,
      referralPercentage,
      refereePercentage,
      paymentQuantityThreshold,
      paymentValueThreshold,
      maxRewardLevels,
    ],
  });

  for (const a of accounts) {
    await deployedToken
      .connect(admin)
      .mint(a.address, BigNumber.from(tokenSupplyPerAccount));

    // approve referral contract to spend tokens of users
    await deployedToken
      .connect(a)
      .approve(proxyContract.address, tokenSupplyPerAccount);
  }

  // approve referral contract to spend tokens
  await deployedToken
    .connect(admin)
    .approve(proxyContract.address, initialTokenSupply);

  return {
    admin,
    receiver,
    updatedReceiver,
    rootReferrer,
    rootReferrer2,
    referee,
    referee2,
    referee3,
    referee4,
    finalReferee,
    proxyContract,
    token: deployedToken,
  };
}
