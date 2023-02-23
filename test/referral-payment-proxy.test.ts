import { ethers } from "hardhat";
import { ethConverter } from "../helpers/converters";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("V1 Referral Payment Proxy", async () => {
  // referral values / conditions (in ether)
  const PAYMENT_AMOUNT = 10;
  const REFERRAL_REWARD = 1;
  const PRICE = PAYMENT_AMOUNT - REFERRAL_REWARD;

  // helper function to deploy the referral contract
  async function deployReferralContractFixture() {
    const [receiver, referrer, referee] = await ethers.getSigners();

    const referralContract = await ethers.getContractFactory(
      "ReferralPaymentProxy"
    );

    const deployedContract = await referralContract.deploy(
      receiver.address,
      ethConverter(PAYMENT_AMOUNT),
      ethConverter(REFERRAL_REWARD)
    );
    await deployedContract.deployed();

    return {
      receiver,
      referrer,
      referee,
      deployedContract,
    };
  }

  it("should forward the correct amount / prize to the receiver", async () => {
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

  it("should send the reward to the referrer", async () => {
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
});
