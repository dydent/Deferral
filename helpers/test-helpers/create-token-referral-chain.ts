// helper function to execute payments to the referral contract n times
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  ERC20,
  V1ReferralMultilevelTokenRewardsUpgradable,
} from "../../typechain-types";
import { BaseContract, BigNumber } from "ethers";

// -----------------------------------------------------------------------------------------------
// specific and adapted helper functions to create a referral chain using token payments during the testing and evaluation processes
// used for the multilevel token payment rewards
// -----------------------------------------------------------------------------------------------

type ValidContractType = V1ReferralMultilevelTokenRewardsUpgradable;

type ReturnType = {
  rootReferrer: SignerWithAddress;
  initialRootReferrerBalance: BigNumber;
  referee: SignerWithAddress;
  initialRefereeBalance: BigNumber;
  referee2: SignerWithAddress;
  initialReferee2Balance: BigNumber;
  referee3: SignerWithAddress;
  initialReferee3Balance: BigNumber;
  referee4: SignerWithAddress;
  initialReferee4Balance: BigNumber;
  finalReferee: SignerWithAddress;
  initialFinalRefereeBalance: BigNumber;
  proxyContract: ValidContractType;
  initialContractBalance: BigNumber;
};

// helper functions for executing N payment transactions to different referral contracts
export async function createTokenReferralChain<
  TokenType extends BaseContract & ERC20
>({
  rootReferrer,
  referee,
  referee2,
  referee3,
  referee4,
  finalReferee,
  proxyContract,
  paymentValue,
  token,
}: {
  rootReferrer: SignerWithAddress;
  referee: SignerWithAddress;
  referee2: SignerWithAddress;
  referee3: SignerWithAddress;
  referee4: SignerWithAddress;
  finalReferee: SignerWithAddress;
  proxyContract: ValidContractType;
  paymentValue: BigNumber;
  token: TokenType;
}): Promise<ReturnType> {
  // register root referrer payment & get balance after payment
  await proxyContract
    .connect(rootReferrer)
    ["registerReferralPayment(uint256)"](paymentValue);
  const initialRootReferrerBalance = await token.balanceOf(
    rootReferrer.address
  );

  // register referee payment & get balance after payment
  await proxyContract
    .connect(referee)
    ["registerReferralPayment(address,uint256)"](
      rootReferrer.address,
      paymentValue
    );
  const initialRefereeBalance = await token.balanceOf(referee.address);

  // register referee2 payment & get balance after payment
  await proxyContract
    .connect(referee2)
    ["registerReferralPayment(address,uint256)"](referee.address, paymentValue);
  const initialReferee2Balance = await token.balanceOf(referee2.address);

  // register referee3 payment & get balance after payment
  await proxyContract
    .connect(referee3)
    ["registerReferralPayment(address,uint256)"](
      referee2.address,
      paymentValue
    );
  const initialReferee3Balance = await token.balanceOf(referee3.address);

  // register referee4 payment & get balance after payment
  await proxyContract
    .connect(referee4)
    ["registerReferralPayment(address,uint256)"](
      referee3.address,
      paymentValue
    );
  const initialReferee4Balance = await token.balanceOf(referee4.address);

  // register final referee payment & get balance after payment
  await proxyContract
    .connect(finalReferee)
    ["registerReferralPayment(address,uint256)"](
      referee4.address,
      paymentValue
    );
  const initialFinalRefereeBalance = await token.balanceOf(
    finalReferee.address
  );

  // get contract balance after all registered payments
  const initialContractBalance = await token.balanceOf(proxyContract.address);

  return {
    rootReferrer,
    initialRootReferrerBalance,
    referee,
    initialRefereeBalance,
    referee2,
    initialReferee2Balance,
    referee3,
    initialReferee3Balance,
    referee4,
    initialReferee4Balance,
    finalReferee,
    initialFinalRefereeBalance,
    proxyContract,
    initialContractBalance,
  };
}
