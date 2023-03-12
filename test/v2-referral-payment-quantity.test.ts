import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethConverter } from "../helpers/converters";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  OWNABLE_ERROR_STRING,
  REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED,
  REWARD_PERCENTAGE_OUT_OF_BOUNDS,
} from "../helpers/constants/error-strings";
import { deployPaymentQuantityUpgradableFixture } from "../helpers/test-helpers/payment-quantity-fixtures";
import { V1ReferralQuantityPaymentUpgradable } from "../typechain-types";

// TEST CONSTANTS
const PAYMENT_QUANTITY_CONTRACT = "V2ReferralQuantityPaymentUpgradable";
// must be between 0 and 100!
const REFERRAL_PERCENTAGE = 50;
const PAYMENT_AMOUNT = 1000;
const REFERRAL_REWARD = (PAYMENT_AMOUNT / 100) * REFERRAL_PERCENTAGE;
const PRIZE = PAYMENT_AMOUNT - REFERRAL_REWARD;
// number of payment transactions for a referral process to be complete = threshold +1
const QUANTITY_THRESHOLD = 2;

// noinspection DuplicatedCode
describe(`"Testing ${PAYMENT_QUANTITY_CONTRACT} referral contract`, async () => {
  // get fixture function for testing
  const deployUpgradableFixture = async () => {
    return deployPaymentQuantityUpgradableFixture({
      contractName: PAYMENT_QUANTITY_CONTRACT,
      referralPercentage: REFERRAL_PERCENTAGE,
      quantityThreshold: QUANTITY_THRESHOLD,
    });
  };

  // helper function to execute payments to the referral contract n times
  async function executeReferralPayment({
    nTimes,
    referee,
    referrer,
    proxyContract,
    paymentValue,
  }: {
    nTimes: number;
    referee: SignerWithAddress;
    referrer: SignerWithAddress;
    proxyContract: V1ReferralQuantityPaymentUpgradable;
    paymentValue: number;
  }): Promise<void> {
    for (let i = 0; i < nTimes; i++) {
      const referrerAddress = await referrer.getAddress();
      // await referral process
      await proxyContract
        .connect(referee)
        .registerReferralPayment(referrerAddress, {
          value: ethConverter(paymentValue),
        });
    }
  }

  // -----------------------------------------------------------------------------------------------
  // Unit tests for updating contract values
  // -----------------------------------------------------------------------------------------------

  describe(`Updating Contract Values`, async () => {
    it(`${PAYMENT_QUANTITY_CONTRACT} should update receiver address`, async () => {
      const { admin, receiver, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      const receiverAddress = await receiver.getAddress();

      // update receiver address
      await proxyContract.connect(admin).updateReceiverAddress(receiverAddress);

      const contractReceiverAddress = await proxyContract.receiverAddress();

      // assertions
      expect(receiverAddress).to.equal(contractReceiverAddress);
    });

    it(`${PAYMENT_QUANTITY_CONTRACT} should update referral reward percentage`, async () => {
      const { admin, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      // test with regular and inbound boundary values
      const validUpdatedReferralRewardPercentages = [0, 20, 100];

      for (const updatedValue of validUpdatedReferralRewardPercentages) {
        // update payment amount
        await proxyContract.connect(admin).updateReferralReward(updatedValue);

        const contractReferralRewardPercentage =
          await proxyContract.rewardPercentage();

        // assertions
        expect(contractReferralRewardPercentage).to.equal(updatedValue);
      }
    });
    it(`${PAYMENT_QUANTITY_CONTRACT} should throw if updated referral reward percentage is not between 0 and 100`, async () => {
      const { admin, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      // test with invalid and outbound boundary values
      const invalidUpdatedReferralRewardPercentages = [101, 500];

      for (const updatedValue of invalidUpdatedReferralRewardPercentages) {
        const referralRewardUpdatePromise = proxyContract
          .connect(admin)
          .updateReferralReward(updatedValue);

        // expect to fail
        await expect(referralRewardUpdatePromise).to.be.rejectedWith(
          REWARD_PERCENTAGE_OUT_OF_BOUNDS
        );
      }
    });
    it(`${PAYMENT_QUANTITY_CONTRACT} should update requiredAmountOfPayments`, async () => {
      const { admin, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      // test with regular and inbound boundary values
      const validUpdatedRequiredAmountOfPaymentValues = [0, 6, 10];

      for (const updatedValue of validUpdatedRequiredAmountOfPaymentValues) {
        // update payment amount
        await proxyContract
          .connect(admin)
          .updateRequiredAmountOfPayments(updatedValue);

        const contractReferralRewardPercentage =
          await proxyContract.requiredAmountOfPayments();

        // assertions
        expect(contractReferralRewardPercentage).to.equal(updatedValue);
      }
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Unit tests for function modifiers and conditions
  // -----------------------------------------------------------------------------------------------

  describe(`Function Modifiers`, async () => {
    it(`${PAYMENT_QUANTITY_CONTRACT} should throw if non-admin tries to update contract`, async () => {
      const { referrer, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      const updatedReferralReward = ethConverter(3);
      const receiverAddress = await referrer.getAddress();

      const expectedError = OWNABLE_ERROR_STRING;

      const referralRewardUpdatePromise = proxyContract
        .connect(referrer)
        .updateReferralReward(updatedReferralReward);
      const receiverAddressUpdatePromise = proxyContract
        .connect(referrer)
        .updateReceiverAddress(receiverAddress);
      const requiredAmountOfPaymentsUpdatePromise = proxyContract
        .connect(referrer)
        .updateRequiredAmountOfPayments(receiverAddress);

      // await calls to be rejected since they are not owner of the contract
      await expect(referralRewardUpdatePromise).to.be.rejectedWith(
        expectedError
      );
      await expect(receiverAddressUpdatePromise).to.be.rejectedWith(
        expectedError
      );
      await expect(requiredAmountOfPaymentsUpdatePromise).to.be.rejectedWith(
        expectedError
      );
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Integration Testing of Referral Process / Unit testing for register payment function
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Referral Process `, async () => {
    it(`${PAYMENT_QUANTITY_CONTRACT} should subtract payment amount from referee account`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );
      const initialRefereeBalance = await referee.getBalance();

      // await referral process transaction
      const referralTx = await proxyContract
        .connect(referee)
        .registerReferralPayment(referrer.address, {
          value: ethConverter(PAYMENT_AMOUNT),
        });

      // calculate referral transaction costs
      const txReceipt = await referralTx.wait();

      // gas used by the transaction
      const txGasUsed = await txReceipt.gasUsed;
      // gas price
      const txEffectiveGasPrice = await txReceipt.effectiveGasPrice;
      // tx costs
      const txCost = txGasUsed.mul(txEffectiveGasPrice);
      // results balances
      const contractBalance = await proxyContract.getBalance();
      const afterRefereeBalance = await referee.getBalance();
      const refereeResult =
        initialRefereeBalance.toBigInt() -
        txCost.toBigInt() -
        ethConverter(PAYMENT_AMOUNT).toBigInt();

      // assertions
      expect(afterRefereeBalance.toBigInt()).to.equal(refereeResult);
      expect(contractBalance.toBigInt()).to.equal(
        ethConverter(REFERRAL_REWARD).toBigInt()
      );
    });
    it(`${PAYMENT_QUANTITY_CONTRACT} should forward the correct amount / prize to the receiver account`, async () => {
      const { receiver, referrer, referee, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      const initialReceiverBalance = await receiver.getBalance();

      const numberOfPayments = QUANTITY_THRESHOLD + 1;

      // check that forwarded amount is correct for every iteration while the referral process is ongoing
      for (const iteration of Array.from(
        { length: numberOfPayments },
        (_, i) => i + 1
      )) {
        console.log("iteration", iteration, "");
        await executeReferralPayment({
          nTimes: 1,
          referee,
          referrer,
          proxyContract,
          paymentValue: PAYMENT_AMOUNT,
        });

        const afterReceiverBalance = await receiver.getBalance();
        const receiverResult =
          initialReceiverBalance.toBigInt() +
          ethConverter(PRIZE * iteration).toBigInt();
        expect(afterReceiverBalance.toBigInt()).to.equal(receiverResult);
      }
    });

    it(`${PAYMENT_QUANTITY_CONTRACT} should update the referral process data correctly during the uncompleted referral process`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      const initialReferrerBalance = await referrer.getBalance();

      // complete referral process
      await executeReferralPayment({
        nTimes: QUANTITY_THRESHOLD,
        referee,
        referrer,
        proxyContract,
        paymentValue: PAYMENT_AMOUNT,
      });

      const referralProcessMapping = await proxyContract.refereeProcessMapping(
        referee.address
      );

      // assert data is updated correctly
      expect(referralProcessMapping.referralProcessCompleted).to.equal(false);
      expect(referralProcessMapping.referrerAddressHasBeenSet).to.equal(true);
      expect(referralProcessMapping.referrerAddress).to.equal(referrer.address);
      expect(referralProcessMapping.paidValue).to.equal(
        ethConverter(PAYMENT_AMOUNT * QUANTITY_THRESHOLD).toBigInt()
      );
      expect(referralProcessMapping.paymentQuantity).to.equal(
        QUANTITY_THRESHOLD
      );

      // assert reward has not been paid out after completion
      const afterReferrerBalance = await referrer.getBalance();
      // contract balance
      const contractBalance = await proxyContract.getBalance();
      expect(afterReferrerBalance.toBigInt()).to.equal(
        initialReferrerBalance.toBigInt()
      );

      expect(contractBalance.toBigInt()).to.equal(
        ethConverter(
          (PAYMENT_AMOUNT / 100) * REFERRAL_PERCENTAGE * QUANTITY_THRESHOLD
        ).toBigInt()
      );
    });

    it(`${PAYMENT_QUANTITY_CONTRACT} should send the reward to the referrer account if referral process is completed`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      // get initial balances
      const initialReferrerBalance = await referrer.getBalance();

      // number of payments in order for the referral process to be completed
      const numberOfPaymentTransactions = QUANTITY_THRESHOLD + 1;

      // complete referral process
      await executeReferralPayment({
        nTimes: numberOfPaymentTransactions,
        referee,
        referrer,
        proxyContract,
        paymentValue: PAYMENT_AMOUNT,
      });

      const referralProcessMapping = await proxyContract.refereeProcessMapping(
        referee.address
      );

      // assert data is updated correctly
      expect(referralProcessMapping.referralProcessCompleted).to.equal(true);
      expect(referralProcessMapping.referrerAddressHasBeenSet).to.equal(true);
      expect(referralProcessMapping.referrerAddress).to.equal(referrer.address);
      expect(referralProcessMapping.paidValue).to.equal(
        ethConverter(PAYMENT_AMOUNT * numberOfPaymentTransactions).toBigInt()
      );
      expect(referralProcessMapping.paymentQuantity).to.equal(
        numberOfPaymentTransactions
      );

      // assert reward has been paid out after completion
      const afterReferrerBalance = await referrer.getBalance();
      const contractBalance = await proxyContract.getBalance();

      const expectedPaidOutReward =
        REFERRAL_REWARD * numberOfPaymentTransactions;
      const referrerResult =
        initialReferrerBalance.toBigInt() +
        ethConverter(expectedPaidOutReward).toBigInt();
      expect(afterReferrerBalance.toBigInt()).to.equal(referrerResult);
      // contract balance should be 0 since reward has been paid out
      expect(contractBalance.toBigInt()).to.equal(0);
    });

    it(`${PAYMENT_QUANTITY_CONTRACT} should throw if referee with completed referral tries to do a payment transaction`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      // number of payments in order for the referral process to be completed
      const numberOfPaymentTransactions = QUANTITY_THRESHOLD + 1;

      // complete referral process
      await executeReferralPayment({
        nTimes: numberOfPaymentTransactions,
        referee,
        referrer,
        proxyContract,
        paymentValue: PAYMENT_AMOUNT,
      });

      const expectedError = REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED;

      // await referral process transaction after the referral has been completed
      const referralTxPromise = proxyContract
        .connect(referee)
        .registerReferralPayment(referrer.address, {
          value: ethConverter(PAYMENT_AMOUNT),
        });

      // await calls to be rejected since referral has been completed
      await expect(referralTxPromise).to.be.rejectedWith(expectedError);
    });
  });
});
