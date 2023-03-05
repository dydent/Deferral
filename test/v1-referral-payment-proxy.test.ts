import { ethers } from "hardhat";
import { ethConverter } from "../helpers/converters";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  EXACT_AMOUNT_ERROR,
  OWNABLE_ERROR_STRING,
  REWARD_AMOUNT_PROPORTION_ERROR,
} from "../helpers/constants/error-strings";
import { V1ReferralPaymentProxy } from "../types";

type FixtureReturnType = {
  admin: SignerWithAddress;
  receiver: SignerWithAddress;
  updatedReceiver: SignerWithAddress;
  referrer: SignerWithAddress;
  referee: SignerWithAddress;
  deployedContract: V1ReferralPaymentProxy;
};

const CONTRACT = "V1ReferralPaymentProxy";

describe(`Testing ${CONTRACT} Contract`, async () => {
  // referral values / conditions (in ether)
  const PAYMENT_AMOUNT = 10;
  const REFERRAL_REWARD = 1;
  const PRICE = PAYMENT_AMOUNT - REFERRAL_REWARD;

  // helper function to deploy the referral contract
  async function deployReferralContractFixture(): Promise<FixtureReturnType> {
    const [admin, receiver, updatedReceiver, referrer, referee] =
      await ethers.getSigners();

    const referralContract = await ethers.getContractFactory(CONTRACT);

    const deployedContract = (await referralContract.deploy(
      receiver.address,
      ethConverter(PAYMENT_AMOUNT),
      ethConverter(REFERRAL_REWARD)
    )) as V1ReferralPaymentProxy;
    await deployedContract.deployed();

    return {
      admin,
      receiver,
      updatedReceiver,
      referrer,
      referee,
      deployedContract,
    };
  }

  // -----------------------------------------------------------------------------------------------
  // Unit tests for updating contract values
  // -----------------------------------------------------------------------------------------------

  describe(`Updating Contract Values`, async () => {
    it(`${CONTRACT} should update payment amount`, async () => {
      const { admin, deployedContract } = await loadFixture(
        deployReferralContractFixture
      );

      const updatedPaymentAmount = ethConverter(5);

      // update payment amount
      await deployedContract
        .connect(admin)
        .updatePaymentAmount(updatedPaymentAmount);

      const contractPaymentAmount = await deployedContract.paymentAmount();

      // assertions
      expect(contractPaymentAmount.toBigInt()).to.equal(
        updatedPaymentAmount.toBigInt()
      );
    });

    it(`${CONTRACT} should update receiver address`, async () => {
      const { admin, updatedReceiver, deployedContract } = await loadFixture(
        deployReferralContractFixture
      );

      const updatedReceiverAddress = await updatedReceiver.getAddress();

      // update receiver address
      await deployedContract
        .connect(admin)
        .updateReceiverAddress(updatedReceiverAddress);

      const contractReceiverAddress = await deployedContract.receiver();

      // assertions
      expect(updatedReceiverAddress).to.equal(contractReceiverAddress);
    });

    it(`${CONTRACT} should update referral reward`, async () => {
      const { admin, deployedContract } = await loadFixture(
        deployReferralContractFixture
      );

      const updatedReferralReward = ethConverter(3);

      // update payment amount
      await deployedContract
        .connect(admin)
        .updateReferralReward(updatedReferralReward);

      const contractReferralReward = await deployedContract.referralReward();

      // assertions
      expect(contractReferralReward.toBigInt()).to.equal(
        updatedReferralReward.toBigInt()
      );
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Unit tests for function modifiers and conditions
  // -----------------------------------------------------------------------------------------------

  describe(`Function Modifiers`, async () => {
    it(`${CONTRACT} should throw if updated referral reward is bigger than payment`, async () => {
      const { admin, deployedContract } = await loadFixture(
        deployReferralContractFixture
      );

      const updatedReferralReward = ethConverter(PAYMENT_AMOUNT + 1);

      const expectedError = REWARD_AMOUNT_PROPORTION_ERROR;

      const referralRewardUpdatePromise = deployedContract
        .connect(admin)
        .updateReferralReward(updatedReferralReward);

      // expect to fail
      await expect(referralRewardUpdatePromise).to.be.rejectedWith(
        expectedError
      );
    });

    it(`${CONTRACT} should throw if non-admin tries to update contract`, async () => {
      const { referrer, deployedContract } = await loadFixture(
        deployReferralContractFixture
      );

      const updatedReferralReward = ethConverter(3);
      const updatedReceiverAddress = await referrer.getAddress();

      const expectedError = OWNABLE_ERROR_STRING;

      const referralRewardUpdatePromise = deployedContract
        .connect(referrer)
        .updateReferralReward(updatedReferralReward);
      const paymentAmountUpdatePromise = deployedContract
        .connect(referrer)
        .updatePaymentAmount(updatedReferralReward);
      const receiverAddressUpdatePromise = deployedContract
        .connect(referrer)
        .updateReceiverAddress(updatedReceiverAddress);

      // await calls to be rejected since they are not owner of the contract
      await expect(referralRewardUpdatePromise).to.be.rejectedWith(
        expectedError
      );
      await expect(paymentAmountUpdatePromise).to.be.rejectedWith(
        expectedError
      );
      await expect(receiverAddressUpdatePromise).to.be.rejectedWith(
        expectedError
      );
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Integration Testing of Referral Process / Unit testing for forwarding function
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Referral Process `, async () => {
    it(`${CONTRACT} should forward the correct amount / prize to the receiver account`, async () => {
      const { receiver, referrer, referee, deployedContract } =
        await loadFixture(deployReferralContractFixture);

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

    it(`${CONTRACT} should throw if payment value is not exact`, async () => {
      const { referrer, referee, deployedContract } = await loadFixture(
        deployReferralContractFixture
      );

      const expectedError = EXACT_AMOUNT_ERROR;
      // await referral process
      const referralProcessPromise = deployedContract
        .connect(referee)
        .forwardReferralPayment(referrer.address, {
          value: ethConverter(PAYMENT_AMOUNT / 2),
        });

      // await calls to be rejected since they are not owner of the contract
      await expect(referralProcessPromise).to.be.rejectedWith(expectedError);
    });
  });
});
