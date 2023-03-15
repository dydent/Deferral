import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethConverter } from "../helpers/converters";
import { expect } from "chai";
import {
  OWNABLE_ERROR_STRING,
  REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED,
  REWARD_PERCENTAGE_OUT_OF_BOUNDS,
} from "../helpers/constants/error-strings";
import { deployPaymentValueUpgradableFixture } from "../helpers/test-helpers/payment-value-fixtures";
import { executeReferralPayment } from "../helpers/test-helpers/execute-referral-payments";

// -----------------------------------------------------------------------------------------------
// TEST VALUES
// -----------------------------------------------------------------------------------------------
const PAYMENT_VALUE_CONTRACT = "V1ReferralPaymentValueUpgradable";
// must be between 0 and 100!
const REFERRAL_PERCENTAGE = 30;
const PAYMENT_AMOUNT = 10;
const REFERRAL_REWARD = (PAYMENT_AMOUNT / 100) * REFERRAL_PERCENTAGE;
// amount of accumulated payments that have to be excecuted in payment txs for completing referral process
const VAlUE_THRESHOLD = 50;

// noinspection DuplicatedCode
describe(`"Testing ${PAYMENT_VALUE_CONTRACT} referral contract`, async () => {
  // get fixture function for testing
  const deployUpgradableFixture = async () => {
    return deployPaymentValueUpgradableFixture({
      contractName: PAYMENT_VALUE_CONTRACT,
      referralPercentage: REFERRAL_PERCENTAGE,
      valueThreshold: VAlUE_THRESHOLD,
    });
  };

  // -----------------------------------------------------------------------------------------------
  // Unit tests for updating contract values
  // -----------------------------------------------------------------------------------------------

  describe(`Updating Contract Values`, async () => {
    it(`${PAYMENT_VALUE_CONTRACT} should update receiver address`, async () => {
      const { admin, updatedReceiver, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );
      // assert address are not the same at the start
      const initialAddress = await proxyContract.receiverAddress();
      const updateAddress = await updatedReceiver.getAddress();
      expect(initialAddress).to.not.equal(updateAddress);
      // update receiver address
      await proxyContract.connect(admin).updateReceiverAddress(updateAddress);
      const contractReceiverAddress = await proxyContract.receiverAddress();
      // assert address is updated
      expect(updateAddress).to.equal(contractReceiverAddress);
    });
    it(`${PAYMENT_VALUE_CONTRACT} should update referral reward percentage`, async () => {
      const { admin, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );
      // test with regular and inbound boundary values
      const validUpdateValues = [0, 20, 100];
      // update values and assert they are updated
      for (const updatedValue of validUpdateValues) {
        await proxyContract.connect(admin).updateReferralReward(updatedValue);
        const contractValue = await proxyContract.rewardPercentage();
        expect(contractValue).to.equal(updatedValue);
      }
    });
    it(`${PAYMENT_VALUE_CONTRACT} should throw if updated referral reward percentage is not between 0 and 100`, async () => {
      const { admin, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );
      // test with invalid and outbound boundary values
      const invalidUpdateValues = [101, 500];
      // update values and assert update fails
      for (const updatedValue of invalidUpdateValues) {
        const referralRewardUpdatePromise = proxyContract
          .connect(admin)
          .updateReferralReward(updatedValue);
        await expect(referralRewardUpdatePromise).to.be.rejectedWith(
          REWARD_PERCENTAGE_OUT_OF_BOUNDS
        );
      }
    });
    it(`${PAYMENT_VALUE_CONTRACT} should update valueThreshold`, async () => {
      const { admin, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );
      // test with regular and inbound boundary values
      const validUpdateValues = [0, 6, 10];
      // update values and assert they are updated
      for (const updatedValue of validUpdateValues) {
        await proxyContract
          .connect(admin)
          .updateValueThreshold(ethConverter(updatedValue));
        const contractValue = await proxyContract.valueThreshold();
        expect(contractValue.toBigInt()).to.equal(ethConverter(updatedValue));
      }
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Unit tests for function modifiers and conditions
  // -----------------------------------------------------------------------------------------------

  describe(`Function Modifiers`, async () => {
    it(`${PAYMENT_VALUE_CONTRACT} should throw if non-admin tries to update contract`, async () => {
      const { referrer, updatedReceiver, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );
      const nonAdminSigner = referrer;
      const validReferralReward = ethConverter(3);
      const validReceiverAddress = await updatedReceiver.getAddress();
      const validValueThreshold = ethConverter(65);
      const expectedError = OWNABLE_ERROR_STRING;

      // execute tx with valid values and non-admin signer
      const referralRewardUpdatePromise = proxyContract
        .connect(nonAdminSigner)
        .updateReferralReward(validReferralReward);
      const receiverAddressUpdatePromise = proxyContract
        .connect(nonAdminSigner)
        .updateReceiverAddress(validReceiverAddress);
      const requiredAmountOfPaymentsUpdatePromise = proxyContract
        .connect(nonAdminSigner)
        .updateValueThreshold(validValueThreshold);
      // await tx calls to be rejected since they are not owner of the contract
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
    it(`${PAYMENT_VALUE_CONTRACT} should subtract payment amount from referee account`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );
      const initialBalance = await referee.getBalance();
      // await referral process transaction
      const referralTx = await proxyContract
        .connect(referee)
        .registerReferralPayment(referrer.address, {
          value: ethConverter(PAYMENT_AMOUNT),
        });
      // calculate referral transaction costs
      const txReceipt = await referralTx.wait();
      const txGasUsed = await txReceipt.gasUsed;
      const txEffectiveGasPrice = await txReceipt.effectiveGasPrice;
      const txCost = txGasUsed.mul(txEffectiveGasPrice);
      // calculate result values
      const contractBalance = await proxyContract.getBalance();
      const afterBalance = await referee.getBalance();
      const resultBalance =
        initialBalance.toBigInt() -
        txCost.toBigInt() -
        ethConverter(PAYMENT_AMOUNT).toBigInt();

      // assert balances are correct afterwards
      expect(afterBalance.toBigInt()).to.equal(resultBalance);
      // if referral completed the contract balance should be 0
      if (PAYMENT_AMOUNT > VAlUE_THRESHOLD) expect(contractBalance).to.equal(0);
      else {
        expect(contractBalance.toBigInt()).to.equal(
          ethConverter(REFERRAL_REWARD).toBigInt()
        );
      }
    });
    it(`${PAYMENT_VALUE_CONTRACT} should forward the correct amount / prize to the receiver account`, async () => {
      const { receiver, referrer, referee, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );
      const initialBalance = await receiver.getBalance();
      const numberOfPayments = 2;
      const paymentValue = VAlUE_THRESHOLD / numberOfPayments;

      // check that forwarded amount is correct for every iteration while the referral process is ongoing
      for (const iteration of Array.from(
        { length: numberOfPayments },
        (_, i) => i + 1
      )) {
        await executeReferralPayment({
          executions: 1,
          referee,
          referrer,
          proxyContract,
          paymentValue: paymentValue,
        });
        // calculate result values
        const afterBalance = await receiver.getBalance();
        const receiverResult =
          initialBalance.toBigInt() +
          ethConverter(
            (paymentValue - (paymentValue / 100) * REFERRAL_PERCENTAGE) *
              iteration
          ).toBigInt();
        // assert balances are correct afterwards
        expect(afterBalance.toBigInt()).to.equal(receiverResult);
      }
    });

    it(`${PAYMENT_VALUE_CONTRACT} should update the referral process data correctly during the uncompleted referral process`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );
      const initialBalance = await referrer.getBalance();
      const numberOfPaymentTxs = 4;
      const paymentValue = VAlUE_THRESHOLD / numberOfPaymentTxs;
      // execute n payments in order for the referral process to NOT be completed
      await executeReferralPayment({
        executions: numberOfPaymentTxs,
        referee,
        referrer,
        proxyContract,
        paymentValue: paymentValue,
      });
      const referralProcessMapping = await proxyContract.refereeProcessMapping(
        referee.address
      );
      // assert data is updated correctly
      expect(referralProcessMapping.referralProcessCompleted).to.equal(false);
      expect(referralProcessMapping.referrerAddressHasBeenSet).to.equal(true);
      expect(referralProcessMapping.referrerAddress).to.equal(referrer.address);
      expect(referralProcessMapping.paidValue.toBigInt()).to.equal(
        ethConverter(paymentValue * numberOfPaymentTxs).toBigInt()
      );
      expect(referralProcessMapping.paymentQuantity).to.equal(
        numberOfPaymentTxs
      );
      // assert reward has not been paid out
      const afterReferrerBalance = await referrer.getBalance();
      const contractBalance = await proxyContract.getBalance();
      // assert balances are correct afterwards
      expect(afterReferrerBalance.toBigInt()).to.equal(
        initialBalance.toBigInt()
      );
      expect(contractBalance.toBigInt()).to.equal(
        ethConverter(
          ((numberOfPaymentTxs * paymentValue) / 100) * REFERRAL_PERCENTAGE
        ).toBigInt()
      );
    });

    it(`${PAYMENT_VALUE_CONTRACT} should send the reward to the referrer account if referral process is completed`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );
      const initialBalance = await referrer.getBalance();
      // number of payments in order for the referral process to be completed
      const numberOfPaymentTransactions = 2;
      const paymentValue = VAlUE_THRESHOLD;
      // complete referral process
      await executeReferralPayment({
        executions: numberOfPaymentTransactions,
        referee,
        referrer,
        proxyContract,
        paymentValue: paymentValue,
      });
      const referralProcessMapping = await proxyContract.refereeProcessMapping(
        referee.address
      );
      // assert data is updated correctly
      expect(referralProcessMapping.referralProcessCompleted).to.equal(true);
      expect(referralProcessMapping.referrerAddressHasBeenSet).to.equal(true);
      expect(referralProcessMapping.referrerAddress).to.equal(referrer.address);
      expect(referralProcessMapping.paidValue).to.equal(
        ethConverter(paymentValue * numberOfPaymentTransactions).toBigInt()
      );
      expect(referralProcessMapping.paymentQuantity).to.equal(
        numberOfPaymentTransactions
      );
      // calculate result values
      const afterReferrerBalance = await referrer.getBalance();
      const contractBalance = await proxyContract.getBalance();
      const expectedPaidOutReward =
        (paymentValue / 100) *
        REFERRAL_PERCENTAGE *
        numberOfPaymentTransactions;
      const referrerResult =
        initialBalance.toBigInt() +
        ethConverter(expectedPaidOutReward).toBigInt();
      // assert reward has been paid out after completion
      expect(afterReferrerBalance.toBigInt()).to.equal(referrerResult);
      expect(contractBalance.toBigInt()).to.equal(0);
    });

    it(`${PAYMENT_VALUE_CONTRACT} should throw if referee with completed referral tries to do a payment transaction`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );
      // number of payments in order for the referral process to be completed
      const numberOfPaymentTransactions = 2;
      const paymentValue = VAlUE_THRESHOLD;
      // complete referral process
      await executeReferralPayment({
        executions: numberOfPaymentTransactions,
        referee,
        referrer,
        proxyContract,
        paymentValue: paymentValue,
      });
      const expectedError = REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED;
      // await another referral process transaction after the referral has been completed
      const referralTxPromise = proxyContract
        .connect(referee)
        .registerReferralPayment(referrer.address, {
          value: ethConverter(paymentValue),
        });
      // await calls to be rejected since referral has been completed
      await expect(referralTxPromise).to.be.rejectedWith(expectedError);
    });
  });
});
