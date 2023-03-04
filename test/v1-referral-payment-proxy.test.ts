import { ethers } from "hardhat";
import { ethConverter } from "../helpers/converters";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { V1ReferralPaymentProxy } from "../typechain-types";

type FixtureReturnType = {
  receiver: SignerWithAddress;
  referrer: SignerWithAddress;
  referee: SignerWithAddress;
  deployedContract: V1ReferralPaymentProxy;
};

const CONTRACT = "V1ReferralPaymentProxy";

describe(`Testing ${CONTRACT} contract`, async () => {
  // referral values / conditions (in ether)
  const PAYMENT_AMOUNT = 10;
  const REFERRAL_REWARD = 1;
  const PRICE = PAYMENT_AMOUNT - REFERRAL_REWARD;

  // helper function to deploy the referral contract
  async function deployReferralContractFixture(): Promise<FixtureReturnType> {
    const [receiver, referrer, referee] = await ethers.getSigners();

    const referralContract = await ethers.getContractFactory(CONTRACT);

    const deployedContract = (await referralContract.deploy(
      receiver.address,
      ethConverter(PAYMENT_AMOUNT),
      ethConverter(REFERRAL_REWARD)
    )) as V1ReferralPaymentProxy;
    await deployedContract.deployed();

    return {
      receiver,
      referrer,
      referee,
      deployedContract,
    };
  }

  it(`${CONTRACT} should forward the correct amount / prize to the receiver account`, async () => {
    const { receiver, referrer, referee, deployedContract } = await loadFixture(
      deployReferralContractFixture
    );

    // get initial balances
    const initialReceiverBalance = await receiver.getBalance();

    // execute referral process
    await deployedContract
      .connect(referee)
      .forwardReferralPayment(referrer.address, {
        value: ethConverter(PAYMENT_AMOUNT),
      });

    // results
    const afterReceiverBalance = await receiver.getBalance();
    const receiverResult =
      initialReceiverBalance.toBigInt() + ethConverter(PRICE).toBigInt();

    // assertions
    expect(afterReceiverBalance.toBigInt()).to.equal(receiverResult);
  });

  it(`${CONTRACT} should send the reward to the referrer account`, async () => {
    const { referrer, referee, deployedContract } = await loadFixture(
      deployReferralContractFixture
    );

    // get initial balances
    const initialReferrerBalance = await referrer.getBalance();

    // await referral process
    await deployedContract
      .connect(referee)
      .forwardReferralPayment(referrer.address, {
        value: ethConverter(PAYMENT_AMOUNT),
      });

    // results
    const afterReferrerBalance = await referrer.getBalance();
    const referrerResult =
      initialReferrerBalance.toBigInt() +
      ethConverter(REFERRAL_REWARD).toBigInt();

    // assertions
    expect(afterReferrerBalance.toBigInt()).to.equal(referrerResult);
  });

  it(`${CONTRACT} should subtract payment amount from referee account`, async () => {
    const { referrer, referee, deployedContract } = await loadFixture(
      deployReferralContractFixture
    );

    // get initial balances
    const initialRefereeBalance = await referee.getBalance();

    // await referral process transaction
    const referralTx = await deployedContract
      .connect(referee)
      .forwardReferralPayment(referrer.address, {
        value: ethConverter(PAYMENT_AMOUNT),
      });

    // calculate referral transaction costs
    const txReceipt = await referralTx.wait();

    // gas used by the transaction plus gas used by the transactions executed before the current one and in the same block
    // const txCumulativeGasUsed = await txReceipt.cumulativeGasUsed;

    // gas used by the transaction
    const txGasUsed = await txReceipt.gasUsed;
    // gas price
    const txEffectiveGasPrice = await txReceipt.effectiveGasPrice;
    // tx costs
    const txCost = txGasUsed.mul(txEffectiveGasPrice);

    // results
    const afterRefereeBalance = await referee.getBalance();
    const refereeResult =
      initialRefereeBalance.toBigInt() -
      txCost.toBigInt() -
      ethConverter(PAYMENT_AMOUNT).toBigInt();

    // assertions
    expect(afterRefereeBalance.toBigInt()).to.equal(refereeResult);
  });
});
