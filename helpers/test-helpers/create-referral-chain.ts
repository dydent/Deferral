// helper function to execute payments to the referral contract n times
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethConverter } from "../converters";
import {
  V1MultilevelRewardReferralUpgradable,
  V2MultilevelRewardReferralUpgradable,
} from "../../typechain-types";
import { BigNumber } from "ethers";

type ValidContractType =
  | V1MultilevelRewardReferralUpgradable
  | V2MultilevelRewardReferralUpgradable;

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
export async function createReferralChain({
  rootReferrer,
  referee,
  referee2,
  referee3,
  referee4,
  finalReferee,
  proxyContract,
  paymentValue,
}: {
  rootReferrer: SignerWithAddress;
  referee: SignerWithAddress;
  referee2: SignerWithAddress;
  referee3: SignerWithAddress;
  referee4: SignerWithAddress;
  finalReferee: SignerWithAddress;
  proxyContract: ValidContractType;
  paymentValue: number;
}): Promise<ReturnType> {
  // register root referrer payment & get balance after payment
  await proxyContract
    .connect(rootReferrer)
    ["registerReferralPayment()"]({ value: ethConverter(paymentValue) });
  const initialRootReferrerBalance = await rootReferrer.getBalance();

  // register referee payment & get balance after payment
  await proxyContract
    .connect(referee)
    ["registerReferralPayment(address)"](rootReferrer.address, {
      value: ethConverter(paymentValue),
    });
  const initialRefereeBalance = await referee.getBalance();

  // register referee2 payment & get balance after payment
  await proxyContract
    .connect(referee2)
    ["registerReferralPayment(address)"](referee.address, {
      value: ethConverter(paymentValue),
    });
  const initialReferee2Balance = await referee2.getBalance();

  // register referee3 payment & get balance after payment
  await proxyContract
    .connect(referee3)
    ["registerReferralPayment(address)"](referee2.address, {
      value: ethConverter(paymentValue),
    });
  const initialReferee3Balance = await referee3.getBalance();

  // register referee4 payment & get balance after payment
  await proxyContract
    .connect(referee4)
    ["registerReferralPayment(address)"](referee3.address, {
      value: ethConverter(paymentValue),
    });
  const initialReferee4Balance = await referee4.getBalance();

  // register final referee payment & get balance after payment
  await proxyContract
    .connect(finalReferee)
    ["registerReferralPayment(address)"](referee4.address, {
      value: ethConverter(paymentValue),
    });
  const initialFinalRefereeBalance = await referee4.getBalance();

  // get contract balance after all registered payments
  const initialContractBalance = await proxyContract.getBalance();

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
